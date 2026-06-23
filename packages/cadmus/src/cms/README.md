# `@bowenlabs/cadmus/cms`

A V8-native CMS engine: model content as **collections**, and the engine
generates a Drizzle schema, a typed **Local API** (`find` / `findByID` /
`create` / `update` / `deleteByID`), and serializable **admin metadata** for a
generic admin UI to render against. The Payload-config idea, with zero Node.js
dependency.

`cms` is the one sanctioned exception to Cadmus's zero-cross-primitive rule: it
is typed against the *shape* of a Drizzle instance but never imports
`cadmus/db`. The consumer wires them together explicitly.

```ts
import { db } from "@bowenlabs/cadmus/db";
import { createLocalApi, defineCmsConfig } from "@bowenlabs/cadmus/cms";
```

---

## Defining a config

`defineCmsConfig` validates a config and returns the **resolved** config —
the single source of truth fed to schema codegen, admin metadata, and the
Local API. Always read the value it returns, never the raw input you passed in
(a plugin may have transformed it).

```ts
export const cmsConfig = defineCmsConfig({
  collections: [postsCollection],
  plugins: [seoPlugin({ collections: ["posts"] })],
});
```

With no `plugins`, `defineCmsConfig` returns the input unchanged (by reference).

---

## Plugins — `plugin(config) => config`

A **Cadmea plugin** is a synchronous transform over the whole config, modeled on
Payload's `plugins` array. It may add or modify collections, inject fields, or
register lifecycle hooks. Plugins run in array order, each fed the previous
one's output, **before validation** — so a plugin's output is held to exactly
the same rules as a hand-written config.

```ts
import type { CadmeaPlugin } from "@bowenlabs/cadmus/cms";

const addUpdatedAt: CadmeaPlugin = (config) => ({
  ...config,
  collections: config.collections.map((c) => ({
    ...c,
    fields: { ...c.fields, updatedAt: { type: "date", mode: "timestamp" } },
  })),
});
```

**Rules:** treat the input as immutable — return a new object, never mutate
`config` in place. Plugins are synchronous in this release so the resolved
config can be consumed by sync schema codegen and config loading; an async
variant is a deliberate future extension.

Published first-party plugins live under `@bowenlabs/cadmea-plugin-*` (e.g.
`@bowenlabs/cadmea-plugin-seo`). Community plugins live under
`@cadmus-community/*`.

---

## Hooks

Each collection may declare lifecycle `hooks`. They are enforced by
`createLocalApi` on every operation. Transforming hooks (`beforeChange`,
`beforeRead`, `afterRead`) run in array order, each fed the previous output;
side-effect hooks (`afterChange`, `beforeDelete`, `afterDelete`) run in order
for their effects.

| Hook | When | Signature |
|------|------|-----------|
| `beforeChange` | before validation on create/update | `({ data }) => data` |
| `afterChange` | after a persisted create/update | `({ doc }) => void` |
| `beforeRead` / `afterRead` | per row on `find` / `findByID` | `({ doc }) => doc` |
| `beforeDelete` / `afterDelete` | around a successful delete | `({ id }) => void` |

`beforeChange` runs **before** validation, so a hook may supply or default a
required field (this is how `@bowenlabs/cadmea-plugin-seo` defaults `metaTitle`
from `title`). `afterChange` runs outside the write `try` so a side-effect error
is never mis-reported as a write failure. Read hooks do **not** run on the doc
returned from `create`/`update`. All hooks may be async.

```ts
defineCollection({
  slug: "posts",
  fields: { title: { type: "text", required: true } },
  hooks: {
    beforeChange: [({ data }) => ({ ...data, title: data.title?.trim() })],
  },
});
```

> `access` on a collection is **reserved and not yet enforced** — setting it has
> no effect. Hooks are enforced; access checks are deferred.

---

## Local API

```ts
const posts = createLocalApi(db(env.DB, schema), postsTable, postsCollection);

await posts.create({ title: "Hello" });
await posts.find({ where: eq(postsTable.status, "published") });
```

Pass the **resolved** collection (post-plugin) as the third argument — it
carries the injected fields and registered hooks. `create`/`update` reject
unknown fields and enforce required fields; `relationship` resolution
(`depth > 0`) is reserved and currently throws.
