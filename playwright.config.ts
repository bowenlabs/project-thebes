import { defineConfig } from "@playwright/test";

// Runs against the real Worker 1 (site) dev server — `wrangler dev`, not a
// plain Vite/Astro dev server — so D1/KV bindings, security headers, and
// the Astro SSR fallback all behave exactly as they do in production. See
// CLAUDE.md "Dev commands": pnpm dev:site listens on :3000.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    // Migrate + seed before starting the dev server, so the dynamic
    // [slug] routes (the seeded Home/About/Contact pages) actually
    // resolve — same local D1 state `pnpm seed` always targets.
    command: "pnpm db:migrate && pnpm seed && pnpm dev:site",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
