import { eq } from "drizzle-orm";
import { siteSettings } from "../db/schema.js";
import { db } from "./db.js";

export type SiteSettings = typeof siteSettings.$inferSelect;

// site_settings is a singleton (id always 1, enforced by a CHECK constraint
// — see schema.ts). Both Workers call this directly against their own D1
// binding rather than going through an HTTP hop, same pattern as the
// cadmus/cms Local API (see CLAUDE.md "Data layer").
export async function getSiteSettings(
  d1: D1Database,
): Promise<SiteSettings | null> {
  const row = await db(d1)
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .get();
  return row ?? null;
}
