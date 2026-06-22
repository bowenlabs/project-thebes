import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./index.js";

describe("rate-limit", () => {
  it("allows requests within the limit", async () => {
    const key = `test:${crypto.randomUUID()}`;
    const result = await checkRateLimit(env.KV, key, 3, 60);
    expect(result).toEqual({ allowed: true, remaining: 2 });
  });

  it("blocks once the limit is exceeded", async () => {
    const key = `test:${crypto.randomUUID()}`;
    await checkRateLimit(env.KV, key, 2, 60);
    await checkRateLimit(env.KV, key, 2, 60);
    const third = await checkRateLimit(env.KV, key, 2, 60);
    expect(third).toEqual({ allowed: false, remaining: 0 });
  });

  it("tracks separate keys independently", async () => {
    const keyA = `test:${crypto.randomUUID()}`;
    const keyB = `test:${crypto.randomUUID()}`;
    await checkRateLimit(env.KV, keyA, 1, 60);
    const resultB = await checkRateLimit(env.KV, keyB, 1, 60);
    expect(resultB.allowed).toBe(true);
  });
});
