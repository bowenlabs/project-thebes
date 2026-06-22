import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// TanStack Start can prerender a route at build time. A route that calls a
// server function — whether from `loader`/`beforeLoad`, or from a
// `createQuery`/`createMutation` in the component body — needs
// request-time bindings (`cloudflare:workers` env) that don't exist at
// build time, and prerendering a route also means no client JS ships for
// it, so the component never hydrates. Any route importing a server
// function anywhere in the file must opt out with
// `export const prerender = false`. See CLAUDE.md, SECTION_1_PLAN.md
// milestone 1.18, and issue #19 (the component-body-call case wasn't
// originally covered here and shipped a real hydration bug as a result).
const routesDir = fileURLToPath(
  new URL("../workers/cadmea/src/routes", import.meta.url),
);

function findRouteFiles(dir: string, base = ""): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      return findRouteFiles(`${dir}/${entry.name}`, relPath);
    }
    return /\.tsx?$/.test(entry.name) ? [relPath] : [];
  });
}

const files = findRouteFiles(routesDir);

const offenders: string[] = [];

for (const file of files) {
  const path = `${routesDir}/${file}`;
  const source = readFileSync(path, "utf-8");

  const callsServerFunction =
    /from\s+["'].*\/server-functions\//.test(source) ||
    /from\s+["'].*\/middleware["']/.test(source) ||
    /createServerFn/.test(source);
  if (!callsServerFunction) continue;

  const hasPrerenderFalse = /export\s+const\s+prerender\s*=\s*false/.test(
    source,
  );
  if (!hasPrerenderFalse) {
    offenders.push(file);
  }
}

if (offenders.length > 0) {
  console.error(
    "The following routes call a server function but don't export " +
      "`prerender = false`:\n",
  );
  for (const file of offenders) {
    console.error(`  - workers/cadmea/src/routes/${file}`);
  }
  console.error("\nAdd `export const prerender = false;` to each file above.");
  process.exit(1);
}

console.log("check-prerender: all server-function routes opt out correctly");
