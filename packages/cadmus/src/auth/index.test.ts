import { describe, expect, it } from "vitest";
import {
  generateSessionId,
  generateToken,
  hashToken,
  signSession,
  verifySession,
} from "./index.js";

describe("auth", () => {
  it("generates a 64-char hex token", () => {
    const token = generateToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates distinct tokens across calls", () => {
    expect(generateToken()).not.toBe(generateToken());
  });

  it("generates a 32-char hex session ID", () => {
    const sessionId = generateSessionId();
    expect(sessionId).toMatch(/^[0-9a-f]{32}$/);
  });

  it("hashes a token deterministically", async () => {
    const token = generateToken();
    expect(await hashToken(token)).toBe(await hashToken(token));
  });

  it("produces different hashes for different tokens", async () => {
    expect(await hashToken(generateToken())).not.toBe(
      await hashToken(generateToken()),
    );
  });

  it("signs and verifies a session ID", async () => {
    const sessionId = generateSessionId();
    const sig = await signSession(sessionId, "test-secret");
    expect(await verifySession(sessionId, sig, "test-secret")).toBe(true);
  });

  it("rejects a signature from the wrong secret", async () => {
    const sessionId = generateSessionId();
    const sig = await signSession(sessionId, "secret-a");
    expect(await verifySession(sessionId, sig, "secret-b")).toBe(false);
  });

  it("rejects a tampered session ID", async () => {
    const sessionId = generateSessionId();
    const sig = await signSession(sessionId, "test-secret");
    expect(await verifySession("0".repeat(32), sig, "test-secret")).toBe(false);
  });

  it("rejects a malformed signature without throwing", async () => {
    const sessionId = generateSessionId();
    expect(
      await verifySession(sessionId, "not-base64url!!!", "test-secret"),
    ).toBe(false);
  });
});
