import { env } from "cloudflare:test";
import { createLocalApi } from "@bowenlabs/cadmus/cms";
import { db } from "@bowenlabs/cadmus/db";
import { pagesCollection } from "../../app/cadmea.config";
import { pages } from "@core/db/schema.generated";
import { beforeEach, describe, expect, it } from "vitest";

// Closes the coverage gap flagged on issue #15: app/cadmea.config.ts's
// pagesCollection and app/core/db/schema.generated.ts (the generated
// Drizzle schema the Local API is built against) had zero automated
// coverage — only a manual `wrangler dev` + curl round-trip via the
// CmsService Service Binding (see app/workers/site/src/app.ts's
// /api/cadmea-test route). This exercises the same create/update/delete
// path the Service Binding wraps, directly, against real local D1.
describe("pages Local API (app wiring)", () => {
  const localApi = createLocalApi(db(env.DB), pages, pagesCollection);

  beforeEach(async () => {
    await db(env.DB, { pages }).delete(pages);
  });

  it("creates, updates, and deletes a page through the generated schema", async () => {
    const created = await localApi.create({
      title: "Integration Test Page",
      slug: `int-test-${Date.now()}`,
      status: "draft",
    });
    expect(created.id).toBeDefined();
    expect(created.status).toBe("draft");

    const updated = await localApi.update(created.id, { status: "published" });
    expect(updated.status).toBe("published");

    const found = await localApi.findByID(created.id);
    expect(found.title).toBe("Integration Test Page");

    const deleted = await localApi.deleteByID(created.id);
    expect(deleted.id).toBe(created.id);
    await expect(localApi.findByID(created.id)).rejects.toThrow();
  });

  it("rejects a duplicate slug via the real unique constraint", async () => {
    const slug = `dup-${Date.now()}`;
    await localApi.create({ title: "First", slug, status: "draft" });
    await expect(
      localApi.create({ title: "Second", slug, status: "draft" }),
    ).rejects.toThrow();
  });

  it("round-trips the blocks JSON column", async () => {
    const blocks = [
      { type: "hero", heading: "Welcome" },
      { type: "divider" },
    ];
    const created = await localApi.create({
      title: "Blocks Page",
      slug: `blocks-${Date.now()}`,
      status: "published",
      blocks,
    });
    const found = await localApi.findByID(created.id);
    expect(found.blocks).toEqual(blocks);
  });
});
