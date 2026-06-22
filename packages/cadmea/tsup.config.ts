import { defineConfig } from "tsup";
import * as preset from "tsup-preset-solid";

// Solid's JSX must go through babel-preset-solid to compile to its
// fine-grained-reactive output — plain esbuild JSX transform would
// silently produce non-reactive output. tsup-preset-solid wraps tsup
// with esbuild-plugin-solid (which does this correctly) and generates
// the right server/browser export conditions, matching how solid-js
// itself ships. See DECISIONS.md's 2026-06-22 entries for why this
// package didn't ship this way originally (it was source-only at first,
// consumed only via Vite's workspace-package handling within this
// monorepo — this build makes it safe to consume from outside it too).
const presetOptions: preset.PresetOptions = {
  entries: [
    {
      entry: "src/index.ts",
      server_entry: true,
    },
    {
      name: "tanstack-start",
      entry: "src/tanstack-start/index.ts",
      server_entry: true,
    },
  ],
  cjs: false,
};

export default defineConfig((config) => {
  const watching = !!config.watch;
  const parsedData = preset.parsePresetOptions(presetOptions, watching);

  if (!watching) {
    const packageFields = preset.generatePackageExports(parsedData);
    preset.writePackageJson(packageFields);
  }

  return preset.generateTsupOptions(parsedData);
});
