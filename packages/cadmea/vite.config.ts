import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite-plus";

// Packaging config lives here, in the `pack` block, per vite-plus's own
// guidance — see DECISIONS.md's 2026-06-24 entry. `pack` accepts an array
// of configs (PackUserConfig | PackUserConfig[]), same shape tsdown's
// defineConfig([...]) used — this is a direct port of the previous
// tsdown.config.ts's four-build array, just read from vite.config.ts.
function solidBabel(generate: "dom" | "ssr") {
  return babel({ presets: [["solid", { generate, hydratable: false }]] });
}

const external = [
  "@thebes/cadmus",
  "@tanstack/solid-query",
  "@tanstack/solid-router",
  "solid-js",
];

const shared = {
  outDir: "dist",
  platform: "browser" as const,
  target: "es2022" as const,
  format: ["esm"] as const,
  sourcemap: true,
  deps: { neverBundle: external },
};

export default defineConfig({
  pack: [
    {
      ...shared,
      entry: { "index/index": "src/index.ts" },
      dts: true,
      clean: true,
      plugins: [solidBabel("dom")],
    },
    {
      ...shared,
      entry: { "index/server": "src/index.ts" },
      dts: false,
      clean: false,
      plugins: [solidBabel("ssr")],
    },
    {
      ...shared,
      entry: { "tanstack-start/index": "src/tanstack-start/index.ts" },
      dts: true,
      clean: false,
      plugins: [solidBabel("dom")],
    },
    {
      ...shared,
      entry: { "tanstack-start/server": "src/tanstack-start/index.ts" },
      dts: false,
      clean: false,
      plugins: [solidBabel("ssr")],
    },
  ],
});
