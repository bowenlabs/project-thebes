import { handle } from "@astrojs/cloudflare/handler";
import { Hono } from "hono";
import { api } from "./api.js";

const app = new Hono<{ Bindings: Env }>();

// 1. Custom API routes — checked first (see api.ts)
app.route("/", api);

// 2. Astro SSR — fallback for everything else
app.all("*", async (c) => {
  // @ts-expect-error — Hono's bundled ExecutionContext type lacks the
  // `exports`/`props` fields that wrangler-generated types now require.
  // Upstream bug, no runtime effect: https://github.com/honojs/hono/issues/4493
  return handle(c.req.raw, c.env, c.executionCtx);
});

export default app;
