import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createSession, deleteSession, getSession } from "./index.js";

describe("session", () => {
  it("round-trips a JSON value through KV", async () => {
    const key = `test:${crypto.randomUUID()}`;
    await createSession(env.KV, key, { userId: 1, email: "a@b.com" }, 60);
    expect(await getSession(env.KV, key)).toEqual({
      userId: 1,
      email: "a@b.com",
    });
  });

  it("returns null for a key that was never set", async () => {
    expect(await getSession(env.KV, `test:${crypto.randomUUID()}`)).toBeNull();
  });

  it("deletes a session", async () => {
    const key = `test:${crypto.randomUUID()}`;
    await createSession(env.KV, key, { ok: true }, 60);
    await deleteSession(env.KV, key);
    expect(await getSession(env.KV, key)).toBeNull();
  });
});
