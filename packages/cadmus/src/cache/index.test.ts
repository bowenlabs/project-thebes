import { describe, expect, it } from "vitest";
import { purgeCache } from "./index.js";

describe("purgeCache", () => {
  it("resolves without throwing against the real Workers caches.default", async () => {
    await expect(
      purgeCache("https://example.com/some-cached-page"),
    ).resolves.toBeUndefined();
  });
});
