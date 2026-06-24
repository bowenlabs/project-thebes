// Custom API routes only — no Astro SSR fallback. Split out from app.ts so
// these routes can be exercised in tests/int without needing Astro's Vite
// plugin (the fallback route's `@astrojs/cloudflare/handler` import pulls in
// a virtual module that only exists inside an actual Astro build/dev
// context, which the vitest-pool-workers runtime doesn't provide).
//
// The magic-link/verify/logout routes below stay Hono routes (rather than
// real `src/pages/api/*.ts` Astro pages) for exactly that reason, but
// delegate their actual logic to @thebes/cadmus/astro's
// createMagicLinkHandlers/createLogoutHandler via runAstroRoute() — a
// minimal Hono-Context-to-Astro-APIContext shim — so this Worker dogfoods
// the same primitive #32 built for real Astro pages elsewhere. See
// issue #33.

import { users } from "@core/db/schema";
import { verifyPreviewToken } from "@core/lib/auth";
import { parseBlocks, renderBlocksToHtml } from "@core/lib/blocks";
import { createImageService } from "@core/lib/image-service";
import { sendEmail } from "@core/lib/notify";
import { securityHeaders } from "@core/lib/security-headers";
import {
  createSession as createCoreSession,
  deleteSession as deleteCoreSession,
} from "@core/lib/session";
import {
  createLogoutHandler,
  createMagicLinkHandlers,
} from "@thebes/cadmus/astro";
import { db } from "@thebes/cadmus/db";
import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { Hono } from "hono";
import { generateCookie, getCookie } from "hono/cookie";

export const api = new Hono<{ Bindings: Env }>();

type UserRow = typeof users.$inferSelect;

// createMagicLinkHandlers/createLogoutHandler's option callbacks all take
// an APIContext, so env bindings have to travel through that object rather
// than through a closure over Hono's `c` — buildAstroContext() stows them on
// this extra `env` field rather than guessing at @astrojs/cloudflare's
// `locals.runtime.env` convention, since this Worker never actually runs
// through that adapter for these routes (see the module comment above).
type SiteAPIContext = APIContext & { env: Env };

function envOf(context: APIContext): Env {
  return (context as SiteAPIContext).env;
}

const LOGIN_PATH = "/login";

// createMagicLinkHandlers' GET handler only ever calls context.redirect()
// with one of two shapes: `${LOGIN_PATH}?error=...` on failure (same
// Worker — the login page lives here), or the post-verify destination on
// success, which for this app always means Worker 2's (Cadmea) admin —
// see CLAUDE.md "Cookie domain"/"Authentication". The library has no hook
// to tell these apart itself, so this distinguishes on the one fixed
// prefix it's configured to use for the failure case below.
function siteRedirect(c: Context<{ Bindings: Env }>, path: string): Response {
  const location = path.startsWith(LOGIN_PATH)
    ? path
    : new URL(path, c.env.CADMEA_URL).toString();
  return new Response(null, { status: 302, headers: { Location: location } });
}

// Astro's real cookie jar writes Set-Cookie headers into the Response its
// own rendering pipeline builds — a mechanism that doesn't exist here,
// since these handlers return a plain Response straight to Hono.
// setCookie(c, ...)'s usual approach of writing through c.header() doesn't
// help either: it only lands if something has already forced Hono's
// lazily-created c.res into existence, which a handler that returns its
// own raw Response (every path here) never does. So cookies.set/delete
// below just collect Set-Cookie strings, and runAstroRoute() appends them
// onto the handler's returned Response itself once it comes back.
function buildAstroContext(
  c: Context<{ Bindings: Env }>,
  cookieHeaders: string[],
): APIContext {
  return {
    request: c.req.raw,
    url: new URL(c.req.url),
    env: c.env,
    cookies: {
      get: (name: string) => {
        const value = getCookie(c, name);
        return value === undefined ? undefined : { value };
      },
      set: (
        name: string,
        value: string,
        options?: {
          httpOnly?: boolean;
          secure?: boolean;
          sameSite?: "lax" | "strict" | "none";
          path?: string;
          maxAge?: number;
        },
      ) => {
        cookieHeaders.push(generateCookie(name, value, options));
      },
      delete: (name: string, options?: { path?: string }) => {
        cookieHeaders.push(generateCookie(name, "", { ...options, maxAge: 0 }));
      },
    },
    redirect: (path: string) => siteRedirect(c, path),
    locals: {},
  } as unknown as APIContext;
}

async function runAstroRoute(
  c: Context<{ Bindings: Env }>,
  handler: (context: APIContext) => Response | Promise<Response>,
): Promise<Response> {
  const cookieHeaders: string[] = [];
  const response = await handler(buildAstroContext(c, cookieHeaders));
  if (cookieHeaders.length === 0) return response;

  const merged = new Response(response.body, response);
  for (const cookie of cookieHeaders)
    merged.headers.append("Set-Cookie", cookie);
  return merged;
}

const requestHostname = (context: APIContext) => context.url.hostname;

// See CLAUDE.md "Authentication" — dev mode logs the raw link instead of
// relying on email delivery. wrangler dev's local send_email emulation
// doesn't fail the way an unconfigured production domain would (it just
// writes an .eml file to disk), so sendMagicLinkEmail's own success/failure
// isn't a reliable dev signal; `localhost` is, since no deployed
// environment is ever literally that.
function isLocalDev(context: APIContext): boolean {
  const hostname = requestHostname(context);
  return hostname === "localhost" || hostname === "127.0.0.1";
}

const { POST: magicLinkPOST, GET: verifyGET } =
  createMagicLinkHandlers<UserRow>({
    kv: (context) => envOf(context).KV,
    secret: (context) => envOf(context).SESSION_SECRET,
    cookieName: "cadmea_session",
    loginPath: LOGIN_PATH,
    findUser: async (context, email) => {
      const env = envOf(context);
      const user = await db(env.DB, { users })
        .select()
        .from(users)
        .where(eq(users.email, email))
        .get();
      return user ?? null;
    },
    createSession: (context, user) =>
      createCoreSession(envOf(context).SESSION, {
        userId: user.id,
        email: user.email,
        role: user.role,
      }),
    sendMagicLinkEmail: async (context, { email, verifyUrl }) => {
      const env = envOf(context);
      await sendEmail(env, {
        from: `noreply@${requestHostname(context)}`,
        to: email,
        subject: "Your Cadmea sign-in link",
        html: `<p>Click to sign in: <a href="${verifyUrl.toString()}">${verifyUrl.toString()}</a></p><p>This link expires in 15 minutes.</p>`,
      });
    },
    isLocalDev,
    onLocalDev: (_context, { email, verifyUrl }) => {
      console.log(`[dev] Magic link for ${email}: ${verifyUrl.toString()}`);
    },
    defaultRedirect: (context) =>
      new URL("/admin/dashboard", envOf(context).CADMEA_URL).toString(),
  });

const logoutPOST = createLogoutHandler({
  cookieName: "cadmea_session",
  deleteSession: (context, sessionId) =>
    deleteCoreSession(envOf(context).SESSION, sessionId),
  redirectTo: LOGIN_PATH,
});

api.use("*", securityHeaders);

// Proves the CadmeaService Service Binding round-trips through Worker 2
// (Cadmea) and D1. No real page needs this write path yet — see issue #16.
// Note: combining Drizzle's InferSelectModel with the Service<T>/Fetcher<T>
// RPC stub's own recursive type machinery can hit TS's instantiation-depth
// limit under a full `tsc --noEmit` project check (not run anywhere in this
// repo's build/lint pipeline — `pnpm build:site`/`pnpm build:cadmea` are
// esbuild/vite-based and unaffected). A known rough edge combining
// Cloudflare's RPC types with Drizzle's generics; no runtime effect.
api.post("/api/cadmea-test", async (c) => {
  const created = await c.env.CADMEA.create("pages", {
    title: "Service binding test",
    slug: `service-binding-test-${Date.now()}`,
  });
  await c.env.CADMEA.deleteByID("pages", created.id);
  return c.json({ ok: true, created });
});

// Magic-link request — see CLAUDE.md "Authentication". Never confirms or
// denies whether the email belongs to an account; always returns 200, so
// the request can't be used to enumerate registered emails. Delegates to
// @thebes/cadmus/astro's handler — see the module comment above.
api.post("/api/auth/magic-link", (c) => runAstroRoute(c, magicLinkPOST));

// Magic-link verification — single use, hashed lookup, KV-retry-aware
// (see @thebes/cadmus/astro). On success, creates a session and redirects
// cross-Worker into Worker 2's (Cadmea) /admin/dashboard.
//
// Known limitation (CLAUDE.md "Cookie domain"): on *.workers.dev, Worker
// 1's and Worker 2's subdomains are different registered domains (under
// a public suffix), so a host-only cookie set here won't be sent to
// Worker 2 in that environment. Works on localhost (cookies don't scope
// by port) and will work in production once both Workers share a custom
// domain — untested against a real custom domain yet.
api.get("/api/auth/verify", (c) => runAstroRoute(c, verifyGET));

// Live preview (issue #28) — renders a draft version behind a signed,
// time-limited token instead of the published row [slug].astro reads. A
// Hono route rather than an Astro page, like every other route in this
// file (see the module comment above) — Astro pages aren't reachable from
// tests/int, and the verification bar for this phase is a route test, not
// a manual/e2e check. `:slug` is only for a human-readable URL; the actual
// lookup is entirely driven by the token, so a mismatched slug still
// renders correctly — it's not re-validated against the token's page id.
//
// Verifies the token's signature/expiry locally before ever calling the
// CADMEA service binding — cheap, and means an invalid/expired token never
// reaches the RPC call (CadmeaService.getDraftVersion re-verifies it too;
// defense in depth, same pattern as the admin server functions re-checking
// auth despite a route guard).
api.get("/preview/pages/:slug", async (c) => {
  const token = c.req.query("token");
  if (!token || !(await verifyPreviewToken(c.env.SESSION_SECRET, token))) {
    return c.text("Invalid or expired preview link", 403);
  }

  const versionData = await c.env.CADMEA.getDraftVersion("pages", token);
  if (!versionData) return c.text("Invalid or expired preview link", 403);

  const page = versionData as {
    title: string;
    blocks: unknown;
  };
  const imageService = createImageService(c.env.R2, c.env.MEDIA_URL);
  const body = renderBlocksToHtml(parseBlocks(page.blocks), imageService);

  return c.html(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>${escapeHtml(page.title)} (draft preview)</title></head><body><div style="background:#fde68a;padding:8px;text-align:center;font-family:sans-serif">Draft preview — not published</div><article><h1>${escapeHtml(page.title)}</h1>${body}</article></body></html>`,
    200,
    { "Cache-Control": "private, no-store" },
  );
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Logout — clears the session both in KV and the browser cookie. Delegates
// to @thebes/cadmus/astro's handler — see the module comment above.
api.post("/api/auth/logout", (c) => runAstroRoute(c, logoutPOST));

// Default export lets tests/int run this directly as a `main` Worker
// (via SELF.fetch) without Astro's Vite plugin — see app.ts for the real
// entrypoint, which mounts this and adds the Astro SSR fallback.
export default api;
