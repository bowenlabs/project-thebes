import { describe, expect, it } from "vitest";
import { CadmusDbError, CadmusError } from "./errors.js";

describe("CadmusError", () => {
  it("is a real Error subclass carrying a typed code", () => {
    const err = new CadmusDbError("query failed");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(CadmusError);
    expect(err.code).toBe("DB_ERROR");
    expect(err.name).toBe("CadmusDbError");
  });

  it("preserves the original cause", () => {
    const cause = new Error("D1_ERROR");
    const err = new CadmusDbError("query failed", cause);
    expect(err.cause).toBe(cause);
  });
});
