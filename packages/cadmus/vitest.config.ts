import {
  cloudflarePool,
  cloudflareTest,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// Cadmus has no Worker of its own — primitives take raw bindings as
// arguments (see CLAUDE.md "Raw bindings") — so the test pool only needs
// a throwaway D1 binding to exercise db(), not a `main` entrypoint.
const poolOptions = {
  wrangler: { configPath: "./vitest.wrangler.jsonc" },
};

export default defineConfig({
  plugins: [cloudflareTest(poolOptions)],
  test: {
    pool: cloudflarePool(poolOptions),
  },
});
