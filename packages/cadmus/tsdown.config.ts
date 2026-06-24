import { defineConfig } from "tsdown";

// tsdown (Rolldown-based) replaces tsup here — see DECISIONS.md's entry
// superseding the 2026-06-22 Void/Vite+/Rolldown watch-item for why:
// Vite+'s own `vp pack` doesn't load this config file (confirmed bug,
// not a Solid-specific gap), so the underlying engine is used directly.
// No JSX in this package, so this config needs no Solid-specific setup —
// see packages/cadmea/tsdown.config.ts for that.
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "auth/index": "src/auth/index.ts",
    "db/index": "src/db/index.ts",
    "storage/index": "src/storage/index.ts",
    "cache/index": "src/cache/index.ts",
    "email/index": "src/email/index.ts",
    "rate-limit/index": "src/rate-limit/index.ts",
    "session/index": "src/session/index.ts",
    "queues/index": "src/queues/index.ts",
    "hono/index": "src/hono/index.ts",
    "cms/index": "src/cms/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  // Cloudflare Workers target — no Node.js built-ins
  platform: "browser",
  deps: { neverBundle: ["hono", "drizzle-orm", "cloudflare:email"] },
});
