import { env } from "cloudflare:test";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "./index.js";

describe("db", () => {
  it("wraps a raw D1Database binding in a working Drizzle instance", async () => {
    const drizzleDb = db(env.DB);
    const result = await drizzleDb.run(sql`SELECT 1 AS ok`);
    expect(result.results?.[0]).toEqual({ ok: 1 });
  });

  it("accepts the caller's own schema without imposing one of its own", () => {
    const schema = { widgets: { name: "widgets" } };
    const drizzleDb = db(env.DB, schema);
    expect(drizzleDb).toBeDefined();
  });
});
