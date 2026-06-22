import { fileURLToPath } from "node:url";
import {
  cloudflarePool,
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// Integration tests run against this app's real wrangler config (Worker 1
// — site) and a real local D1/KV, never mocked — see CLAUDE.md's testing
// row and issue #15's "no mocked D1" acceptance bar. Migrations come from
// the same files `pnpm db:migrate` applies, so schema drift can't slip
// past these tests.
const poolOptions = async () => {
  const migrations = await readD1Migrations(
    fileURLToPath(new URL("../../app/core/db/migrations", import.meta.url)),
  );
  return {
    wrangler: { configPath: "./wrangler.test.jsonc" },
    miniflare: {
      bindings: { TEST_MIGRATIONS: migrations },
    },
  };
};

export default defineConfig({
  // Without an explicit root, vitest treats the whole pnpm workspace as
  // one project and picks up packages/cadmus's and packages/cadmea's own
  // test files too — each of which needs its own pool config (different
  // wrangler configs), so they fail to start under this one. Scoping the
  // root to this directory keeps `test:int` to just these tests.
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [cloudflareTest(poolOptions)],
  resolve: {
    alias: {
      "@core": fileURLToPath(new URL("../../app/core", import.meta.url)),
      "@custom": fileURLToPath(new URL("../../app/custom", import.meta.url)),
    },
  },
  test: {
    include: ["**/*.test.ts"],
    pool: cloudflarePool(poolOptions),
    setupFiles: [fileURLToPath(new URL("./setup.ts", import.meta.url))],
  },
});
