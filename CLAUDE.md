# Thebes — Claude Code Briefing

> Read this entire document before writing a single line of code.
> Every decision here was made deliberately.
> Do not substitute alternatives without flagging them explicitly.
>
> Also read CADMUS.md before touching anything in packages/cadmus/.

---

## What is Thebes?

Thebes is a monorepo containing two open-source projects:

**Cadmus** — a V8-first, Cloudflare-native full-stack framework. Zero Node.js
assumptions. Cloudflare primitives (D1, KV, R2, Email Workers, Cache API) as
first-class citizens. Composable — each primitive is usable independently.
Designed to make building on Cloudflare so easy and secure that reaching for
a heavier stack feels like the wrong choice.

**Citadel** — a free, open-source, V8-native headless CMS and admin platform.
Built on Cadmus. Operators define content as collections in `citadel.config.ts`
(the equivalent of a `payload.config.ts`) and get a generated admin UI, a
typed query layer, and a REST API — on infrastructure they own forever.
Citadel is Cadmus's reference implementation: it proves the framework works
in production and shows what building on Cadmus looks like end-to-end. It is
also a deliberate proof of concept for what a Payload-CMS-equivalent product
looks like with zero Node.js dependency, running natively in Cloudflare's V8
isolates.

**Maintained by:** BowenLabs (one person)
**License:** MIT
**Repo:** github.com/bowenlabs/thebes
**Framework package:** @bowenlabs/cadmus

**Why the names (for context, not load-bearing):** in the myth, Cadmus
found the Ismenian spring guarded by a dragon, killed it, and from its
sown teeth built the fortified Cadmea — the citadel around which the
city of Thebes grew. Map that loosely: V8 is the spring, Cadmus is the
framework that talks to it directly with no heavier runtime in the way,
Citadel is the hardened CMS admin built on top, Thebes is the monorepo
that holds it all. Cadmus is also credited with bringing the alphabet to
Greece — the resonance worth keeping in mind is "communicator/protocol
designer," not "monster-slayer." See `README.md` for the full version.

---

## Naming — do not change these

| Name | What it is |
|------|-----------|
| **Thebes** | The monorepo |
| **Cadmus** | The framework (`packages/cadmus/`) |
| **@bowenlabs/cadmus** | The npm package |
| **Citadel** | The reference app / product (`apps/citadel/`) |
| **Citadel CMS** | The owner-facing admin UI at `/admin/*` |
| **Extensions** | Citadel add-ons (Section 3+, was "thimbles") |
| **citadel-tooling** | Private Go Orchestrator repo (provisioning, email, distribution) |

---

## Monorepo structure

```
thebes/
├── packages/
│   └── cadmus/                  ← @bowenlabs/cadmus framework package
│       ├── src/
│       │   ├── auth/            ← Web Crypto token gen, HMAC, magic link
│       │   ├── cms/             ← collection/field config, schema codegen, Local API, admin meta
│       │   ├── db/              ← Drizzle + D1 helper
│       │   ├── storage/         ← R2 upload/serve, ImageService interface
│       │   ├── cache/           ← CF Cache API + explicit dev bypass
│       │   ├── email/           ← Email Workers send helper
│       │   ├── rate-limit/      ← KV-based rate limiter
│       │   ├── session/         ← KV session read/write/delete
│       │   ├── queues/          ← producer helper, consumer handler, DLQ pattern
│       │   ├── hono/            ← thin Hono wrappers over raw primitives
│       │   ├── errors.ts        ← CadmusError base class + typed subtypes
│       │   └── index.ts         ← re-exports all primitives
│       ├── dist/                ← tsup output (ESM + CJS + .d.ts) — gitignored
│       ├── tsup.config.ts       ← build config
│       ├── package.json         ← name: "@bowenlabs/cadmus", exports map
│       └── README.md
│
├── apps/
│   └── citadel/                  ← Citadel reference app
│       ├── workers/
│       │   ├── site/            ← Worker 1: Astro public site
│       │   └── cms/             ← Worker 2: TanStack Start CMS/admin (SolidJS)
│       ├── core/                ← Citadel-specific shared code
│       │   ├── db/
│       │   │   ├── schema.ts    ← generated from citadel.config.ts collections
│       │   │   └── migrations/
│       │   ├── lib/             ← Citadel utilities (CMS query helpers, design system, etc.)
│       │   └── components/
│       │       ├── site/        ← Astro components
│       │       └── cms/         ← Solid components (generic collection list/edit views)
│       ├── custom/              ← operator territory — never overwritten by updates
│       │   ├── components/
│       │   ├── extensions/      ← operator custom extensions (Section 3+)
│       │   ├── themes/
│       │   └── seed/
│       ├── citadel.config.ts     ← root collections config — the Payload-config equivalent
│       ├── DECISIONS.md         ← operator architectural decisions
│       └── seed.ts              ← first-deploy seed script
│
├── docs/                        ← Cadmus documentation site (Astro, full skeleton Phase 0)
│
├── examples/                    ← standalone Cadmus usage examples
│   ├── minimal/                 ← smallest possible working Cadmus app (hello world)
│   ├── with-auth/
│   └── with-d1/
│
├── biome.json                   ← covers all packages + apps
├── pnpm-workspace.yaml          ← packages/cadmus, apps/citadel, docs, examples/*
└── package.json                 ← root scripts

```

---

## Two audiences, two layers

**Cadmus is for developers.**
They import `@bowenlabs/cadmus` and get V8-native primitives that work on
Cloudflare without adapter layers, Node shims, or configuration overhead.
Each primitive is independently usable — you can use just `cadmus/auth`
without pulling in `cadmus/db`.

**Citadel is for operators.**
They fork the repo, define their content model as collections in
`citadel.config.ts` (the root collections config — Citadel's equivalent of
a `payload.config.ts`), and deploy. They never touch `core/` or
`packages/cadmus/`. The CMS admin UI and public site are fully generated from
that config — no coding required after the initial deploy.

Code in `packages/cadmus/` must not contain anything Citadel-specific.
Code in `apps/citadel/core/` is Citadel-specific and imports from `@bowenlabs/cadmus`.
Never let this boundary blur.

---

## Stack — do not deviate without flagging

| Layer | Technology |
|-------|-----------|
| Framework | **@bowenlabs/cadmus** — V8-first CF primitives |
| Framework build | **tsup** → `dist/` (ESM + CJS + `.d.ts`) |
| Public site SSR | **Astro** with `@astrojs/cloudflare` adapter — Worker 1 |
| CMS engine | **@bowenlabs/cadmus/cms** — collections, fields, schema codegen, Local API, admin-UI introspection metadata |
| CMS admin | **TanStack Start** (Solid target) — Worker 2, VMFE architecture |
| CMS data fetching | **@tanstack/solid-query** — server state, API communication |
| CMS routing | **@tanstack/solid-router** — built into TanStack Start |
| UI framework | **SolidJS** — fine-grained reactivity, no VDOM, minimal payload for V8 isolates |
| Public API spine | **Hono** — form submission, auth, media upload endpoints |
| Hono integration | **@bowenlabs/cadmus/hono** — thin wrappers over raw primitives |
| Deployment | **Cloudflare Workers** via `wrangler deploy` (two Workers) |
| Architecture | **Vertical Microfrontends (VMFE)** — two independent Workers |
| Database | **Cloudflare D1** (SQLite) via **Drizzle ORM** — shared by both Workers |
| Migrations | **drizzle-kit** — applied once, affects both Workers |
| File storage | **Cloudflare R2** — shared by both Workers |
| Cache invalidation | **Cloudflare Cache API** (`caches.default`) |
| Sessions / rate limiting | **Cloudflare KV** — shared by both Workers |
| Email | **Cloudflare Email Workers** (`send_email` binding) |
| Queues | **Cloudflare Queues** via `@bowenlabs/cadmus/queues` |
| Analytics | **Cloudflare Web Analytics** |
| Fonts | **Cloudflare Fonts** — link to `fonts.googleapis.com`; CF intercepts at edge |
| Icons | **@phosphor-icons/web** — everywhere, no other icon library. No official Solid Phosphor package exists; the framework-agnostic web-component/CSS build is used instead of an unofficial community port |
| UI components | **DaisyUI v5** + **Tailwind v4** — pure CSS, no framework binding required |
| Charts | **Flowbite Charts** (ApexCharts, MIT) — CMS admin only |
| Rich text (CMS) | **TipTap** (`@tiptap/core`, framework-agnostic) — JSON stored natively, no transform layer. No official Solid wrapper; integrate the vanilla core API directly or via the unofficial `solid-tiptap` bindings — decide when Section 2+ builds the editor |
| Linting / formatting | **Biome** — replaces ESLint + Prettier |
| Security scanning | **Snyk** (CI) |
| Testing | **Vitest** + **@cloudflare/vitest-pool-workers** — real Workers runtime |
| TanStack DB | **Section 2+** — reactive client data layer for CMS admin (beta) |

---

## TanStack DB (Section 2+)

TanStack DB is not a replacement for TanStack Query — it extends it with a
reactive client-side data layer. TanStack Query handles server communication;
TanStack DB adds cross-collection queries, live queries, and optimistic
mutations without manual cache wiring.

**Why it matters for Citadel CMS:**
- Mark submission archived → UI updates instantly without waiting for server
- Block canvas saves → related panels update reactively
- Contacts relate to activities relate to submissions — queryable locally

**Scoping decision:**
- **Section 1:** TanStack Query alone. Stable, correct for single-owner
  small datasets. No relational cross-collection needs yet.
- **Section 2+:** Add TanStack DB when team collaboration, real-time inbox,
  and complex relational CMS queries arrive. It layers on top of existing
  TanStack Query code — migration is incremental.

Do not add TanStack DB in Section 1. Flag any PR that introduces it early.

---

## Authentication

Cadmus provides auth primitives. Citadel implements a magic link flow using
those primitives. No passwords. No third-party auth dependencies in Section 1.

```
Flow:   Owner enters email → cadmus/auth generates token (Web Crypto API)
        → hashed token stored in KV (15 min TTL)
        → raw token sent via CF Email Workers
        → owner clicks link → token hashed + validated against KV
        → KV entry deleted (single use)
        → session created → signed cookie set → session stored in KV

Session: Signed cookie (HttpOnly, Secure, SameSite=Lax) + KV entry with TTL
Auth guard: TanStack Start middleware.ts — HMAC verify + KV session lookup

Dev:    OWNER_EMAIL in .dev.vars bypasses email send.
        Raw token logged to console. Navigate directly to /admin/dashboard.
```

**No passwords exist anywhere in this codebase.**

**KV eventual consistency:** KV is eventually consistent. The verify handler
retries token lookup up to 2 times with 100ms delay before returning invalid,
to account for edge propagation lag immediately after token creation.

**Cookie domain:** Session cookies must be tested on a custom domain before
shipping. Cookie scoping on `*.workers.dev` during development differs from
production custom domain behavior — do not assume dev auth matches prod.

Future team access and customer portal auth are Section 2+ concerns.
Do not stub auth abstractions for future use now.

---

## Accessing Cloudflare bindings

Bindings (D1, KV, R2, Email) are accessed differently per layer.
Never pass `env` through props. Never access bindings at module level.

**In Astro pages (Worker 1 — public site):**
```typescript
---
// apps/citadel/workers/site/src/pages/[slug].astro
import { env } from 'cloudflare:workers'
const database = db(env.DB)
const settings = await database.select().from(siteSettings)
  .where(eq(siteSettings.id, 1)).get()
---
```

**In TanStack Start server functions (Worker 2 — CMS):**
```typescript
// apps/citadel/workers/cms/src/server-functions/pages.ts
import { createServerFn } from '@tanstack/solid-start'
import { db } from '@bowenlabs/cadmus/db'

export const getPages = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { env } = await import('cloudflare:workers')
    return db(env.DB).select().from(pages).all()
    // return type flows from Drizzle schema automatically — no manual typing
  })
```

**In CMS components (@tanstack/solid-query):**
```typescript
// apps/citadel/workers/cms/src/routes/admin/pages/index.tsx
import { createQuery } from '@tanstack/solid-query'
import { getPages } from '../../../server-functions/pages'

function PagesPage() {
  const pages = createQuery(() => ({
    queryKey: ['pages'],
    queryFn: () => getPages(),
    // pages is typed from Drizzle schema — zero manual type maintenance
  }))
  // pages.data is the reactive accessor — call it as pages.data, not destructured
}
```

**In Hono public API routes (Worker 2 — custom server entrypoint):**
```typescript
// apps/citadel/workers/cms/app/server.ts
api.post('/api/form/:slug', async (c) => {
  const database = db(c.env.DB)
  const kv = c.env.KV
})
```

Never import `cloudflare:workers` in client-side component code.
Never pass `env` through props or component trees.
All binding access happens in server functions or Hono route handlers.

**Runtime constraint:** Both Workers run in the Cloudflare V8 isolate.
No Node.js APIs anywhere. All crypto via `crypto.subtle` — never
`import crypto from 'crypto'`. This is a Cadmus design principle, not
just a Citadel constraint.

---

## Data layer

Drizzle + D1 underneath, but Citadel no longer hand-writes Drizzle tables.
Content is modeled as **collections** in `citadel.config.ts`, the
equivalent of a `payload.config.ts`. `@bowenlabs/cadmus/cms` turns that
config into a generated Drizzle schema, a typed Local API (`find` /
`findByID` / `create` / `update` / `delete`), and the introspection metadata
the CMS admin UI uses to render generic list/edit views. This supersedes the
2026-06-17 "no CMS" decision in DECISIONS.md — see that file's superseding
entry for why: the earlier decision was against running Payload itself (on
Node, admin disabled); this is a from-scratch V8-native primitive that
reaches the same outcome without that dependency.

Underneath `cadmus/cms`, raw D1 access is still via `@bowenlabs/cadmus/db`.

```typescript
// packages/cadmus/src/db/index.ts
import { drizzle } from 'drizzle-orm/d1'

export function db<TSchema extends Record<string, unknown>>(
  d1: D1Database,
  schema: TSchema
) {
  return drizzle(d1, { schema })
}
```

```typescript
// apps/citadel/core/lib/db.ts
import { db } from '@bowenlabs/cadmus/db'
import * as schema from '../db/schema'

export const createDb = (d1: D1Database) => db(d1, schema)
```

All reads and writes go through Drizzle, generated from collection config.
No hand-maintained abstraction layer on top. Both Workers import from
`apps/citadel/core/` — same generated schema, same Local API, same types.

Schema changes:
1. Edit the `collections` array in `apps/citadel/citadel.config.ts`
2. `pnpm db:generate` — generates `core/db/schema.generated.ts` and a migration in `apps/citadel/core/db/migrations/`
3. `pnpm db:migrate` — applies to local D1
4. `pnpm db:migrate:prod` — applies to production D1

`apps/citadel/core/db/schema.generated.ts` is generated output — never
hand-edited, same convention as a drizzle-kit migration file.

The `pages` collection is the first real collection, carried over from
Phase 0's hand-written `pages` table — it now proves the generated-schema
path against data that's already live in production.

---

## Example collections — `examples/citadel-smb-template/` (not Citadel core)

> Everything in this section used to be Citadel's own schema. As of the CMS
> repositioning, none of it is Citadel-specific anymore — it's a worked
> example of a small-business site built *using* Citadel, kept as the spec
> for `examples/citadel-smb-template/`. Treat the shapes below as a content
> model an operator could define, not as anything Citadel ships by default.
> Citadel core ships no collections except `pages` (Section 1) as a worked
> example.

```
users, sessions, magic_link_tokens, site_settings
  — infra/identity, not content collections; stay in Citadel core as-is.

site_settings (singleton — id = 1 always)
├── identity:         siteName, tagline, logoUrl, faviconUrl
├── appearance:       brandColor, secondaryColor, tertiaryColor,
│                     fontPairing, homepageLayout, darkMode, theme,
│                     spacingPreset, typeTokens (JSON)
├── structuralColors: navBackground, navTextColor,
│                     footerBackground, footerTextColor,
│                     pageBackground, surfaceBackground
├── contact:          email, phone, address, socialLinks (JSON)
├── nav:              navLinks (JSON)
├── seo:              metaDescription, defaultOgImageUrl, disableIndexing
├── domain:           primaryDomain,
│                     domainProvider: 'cloudflare' | 'external' | 'unknown' | null,
│                     nameserverDelegated (boolean, default false),
│                     domainRegisteredViaCitadel (boolean, default false),
│                     cfAccountId (text, nullable),
│                     cfApiTokenScoped (boolean, default false)
└── features:         JSON feature toggle map (all false by default)

pages collection (Citadel core, Section 1 — the one example collection Citadel ships)
├── id, title, slug (unique), blocks (JSON — TipTap JSON array)
├── status: 'draft' | 'published'
└── createdAt, updatedAt, publishedAt

forms, form_submissions, contacts, activities — example-template collections
  (SMB form builder + lightweight CRM), spec lives in
  examples/citadel-smb-template/, not in apps/citadel/core/.
```

---

## Block types (example-template content, not Citadel core)

Page content is stored as a JSON array of blocks — TipTap JSON is the
native storage format, no transform layer. This block-type union is the
template's example field shape for a `richText`/`array` collection field,
not a Citadel-core concept:

```typescript
type Block =
  | { type: 'richText';  content: JSONContent }
  | { type: 'image';     url: string; alt: string; caption?: string }
  | { type: 'hero';      heading: string; subtext?: string; ctaLabel?: string; ctaHref?: string }
  | { type: 'form';      formId: string }
  | { type: 'columns';   columns: Block[][] }
  | { type: 'divider' }
```

The generic block-canvas admin field renders these the same way it would
render any `array`/`richText` field on any collection. The public site
renders them via `<BlockRenderer>`, defined in the example template.

---

## Form builder (example-template content, not Citadel core)

This is the SMB template's worked example of a `forms` collection with a
`fields` JSON array — useful as a reference for building array/group fields
with `cadmus/cms`, not something Citadel ships by default.

```typescript
type FormField =
  | { type: 'text';     name: string; label: string; required: boolean; placeholder?: string }
  | { type: 'email';    name: string; label: string; required: boolean }
  | { type: 'phone';    name: string; label: string; required: boolean }
  | { type: 'textarea'; name: string; label: string; required: boolean; placeholder?: string }
  | { type: 'select';   name: string; label: string; required: boolean; options: string[] }
  | { type: 'checkbox'; name: string; label: string }
```

**Email field detection:** Contact upsert on submission identifies the
email field by `type: 'email'` — not by field name. The form builder UI
must enforce this — `type: 'email'` is a distinct option, not a text variant.

On submission:
1. Validate fields server-side
2. Check rate limit (KV, 10/hour per IP)
3. Check honeypot (`name="website"`, hidden, discard silently if filled)
4. Insert into `form_submissions`
5. Upsert contact if `type: 'email'` field present
6. Log activity (`type: 'form_submission'`)
7. Send notification to owner via CF Email Workers (best-effort)

---

## Media (R2)

Files uploaded to R2, served via public R2 bucket bound to a subdomain
(e.g. `media.yourdomain.com`). Configured at deploy time.

Image URLs stored in the database are always the original R2 URL —
fully qualified, never relative, never transformation URLs.

No server-side image resizing in Section 1. Files served as uploaded.
CMS warns if an uploaded image exceeds 5MB.

All images on the public site use:
- `loading="lazy"` and `decoding="async"`
- `srcset` and `sizes` where dimensions are known
- Explicit `width` and `height` to prevent layout shift

Cloudflare Images is available as a paid extension (Section 3+).

---

## Image service interface

Defined in `@bowenlabs/cadmus/storage`. Implemented in
`apps/citadel/core/lib/image-service.ts`. Never construct image URLs inline.

```typescript
// packages/cadmus/src/storage/index.ts
export interface ImageService {
  upload: (file: File, env: Env) => Promise<{ url: string }>
  render: (image: {
    url: string; width?: number; height?: number; alt: string
  }) => { src: string; srcset?: string; sizes?: string }
}
```

The active image service is resolved once and imported everywhere.
A Cloudflare Images extension replaces the implementation without
touching any component, renderer, or block data.

**Rules:**
- Never call `env.R2.put()` directly in components — always via the service
- Never construct `cdn-cgi/image/...` URLs inline — always via `render()`
- The database always stores the original R2 URL, never a derived URL

---

## Notifications

CF Email Workers `send_email` binding (binding name: `EMAIL`).
Wrapped by `@bowenlabs/cadmus/email`.
From address must be from a domain with CF Email Routing active.

In Section 1, operators configure CF Email Routing manually.
Setup instructions in the README (SPF, DKIM, DMARC).

---

## Security

Security headers in Hono middleware — applies to all responses:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` — **never DENY** (preview iframes require SAMEORIGIN)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- CSP: allowlist Cloudflare Fonts, Cloudflare Analytics, `'self'`

Rate limiting via `@bowenlabs/cadmus/rate-limit` (KV-based).
Honeypot on all public forms (`name="website"`, hidden).

---

## Environment variables

Never in code. Never in version control. In `.dev.vars` for local dev,
Cloudflare Workers secrets for production.

```
# Required — each Worker's .dev.vars for local dev,
# Cloudflare Workers secrets for production
SESSION_SECRET=        ← session signing secret (openssl rand -hex 32)
SERVER_URL=            ← full public site URL, no trailing slash
OWNER_EMAIL=           ← owner email for CMS account + notifications
MEDIA_URL=             ← public R2 bucket base URL, no trailing slash

# Optional
CITADEL_SERVICE_KEY=    ← shared secret for internal service calls
CITADEL_SITE_ID=        ← issued by citadel-tooling, enables managed features
CF_ANALYTICS_TOKEN=    ← Cloudflare Web Analytics token
```

---

## Wrangler bindings

Both Workers have their own `wrangler.jsonc` with **identical binding IDs**.
Same D1 `database_id`, same KV `id`, same R2 `bucket_name`.

```jsonc
// apps/citadel/workers/site/wrangler.jsonc
// apps/citadel/workers/cms/wrangler.jsonc
// (same binding IDs in both — only "name" differs)
{
  "d1_databases": [{ "binding": "DB", "database_name": "citadel-db", "database_id": "..." }],
  "kv_namespaces": [{ "binding": "KV", "id": "..." }],
  "r2_buckets": [{ "binding": "R2", "bucket_name": "citadel-media" }],
  "send_email": [{ "name": "EMAIL" }]
}
```

---

## Dev commands

```bash
# From repo root
pnpm dev:site         # wrangler dev in apps/citadel/workers/site/ — :3000
pnpm dev:cms        # wrangler dev in apps/citadel/workers/cms/ — :3001
pnpm dev              # both Workers via concurrently

pnpm build:cadmus     # tsup → packages/cadmus/dist/
pnpm build:site       # astro build
pnpm build:cms      # vite build
pnpm build            # cadmus → site → cms (in order)

pnpm deploy:site      # wrangler deploy (site)
pnpm deploy:cms     # wrangler deploy (cms)
pnpm deploy           # both (site first)

pnpm db:generate      # drizzle-kit generate from citadel schema
pnpm db:migrate       # apply to local D1
pnpm db:migrate:prod  # apply to production D1
pnpm db:studio        # Drizzle Studio

pnpm seed             # seed.ts against local D1
pnpm lint             # biome check . (all packages + apps)
pnpm format           # biome format --write .
pnpm test             # all tests (cadmus + citadel)
pnpm test:cadmus      # Vitest + @cloudflare/vitest-pool-workers on packages/cadmus/
pnpm test:int         # Citadel integration tests
pnpm test:e2e         # Playwright + axe
```

---

## Five questions before any architectural decision

**For Cadmus primitives:**
1. Does this require a specific framework — breaking framework-agnostic?
2. Does this import from another Cadmus primitive — breaking zero cross-dependency?
3. Does this require Node.js APIs — breaking V8-first?
4. Can this be clearly documented in one page — if not, the design is wrong?
5. Would a developer using a different framework than Citadel benefit from this?

**For Citadel features:**
1. Does this put data in a service the operator doesn't control?
2. Does this require a new account or subscription for the operator?
3. Does this break the free-forever promise for core features?
4. Does this deviate from the Cloudflare-native stack?
5. Does this compromise WCAG 2.1 AA accessibility?

If yes to any: flag it before proceeding.

---

## Key principles

- **V8-first:** No Node.js APIs anywhere. Design for the isolate, not around it.
- **Cloudflare-native:** D1, KV, R2, Email Workers, Queues are first-class — not adapters.
- **Independent primitives:** Each Cadmus primitive usable without the others. Zero cross-primitive dependencies. Always.
- **Raw bindings:** Primitives accept `D1Database`, `KVNamespace` etc. directly — not `Env` or Hono `Context`. Explicit is better than magic.
- **Thrown errors:** `CadmusError` and typed subclasses. Never raw `Error`. Never Result types.
- **Hono is a peer, not a dependency:** `@bowenlabs/cadmus/hono` wraps raw primitives — it never reimplements them.
- **tsup builds dist/:** The exports map points at `dist/`. TypeScript source is for development only. CI validates both.
- **Mobile-first CMS:** Citadel CMS is designed for phones and tablets first. Desktop is an enhancement. Bottom navigation, full-screen views, tap-to-reorder. Never retrofit a desktop UI for mobile.
- **SolidJS, not React:** CMS UI is built in SolidJS — fine-grained reactivity, no virtual DOM, minimal compiled payload for fast cold starts in V8 isolates. Use `createSignal`/`createEffect`, not React hooks. When a dependency has no official Solid package (e.g. Phosphor icons), prefer the framework-agnostic build over an unofficial community port.
- **Scale-appropriate:** Don't build for scale you don't have. No premature abstractions.
- **No throwaway work:** Every decision should hold up across phases.
- **Clean boundaries:** Cadmus has no Citadel-specific code. Citadel imports from Cadmus, never the reverse. Extension distribution logic stays in citadel-tooling.
- **Documentation is the product:** Cadmus should be so well documented that reaching for AI to understand it feels unnecessary. If something can't be documented clearly, the design is wrong.

---

*Thebes — Open source. Always free. Built with care.*
*A BowenLabs project.*
