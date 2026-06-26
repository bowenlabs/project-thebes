import { describe, expect, it } from "vitest";
import { computeRetailPrice } from "./pricing.js";

describe("computeRetailPrice", () => {
  it("both: cost + percent + fixed, rounded to $0.50", () => {
    // 10 + 75% + 5 = 22.5
    expect(
      computeRetailPrice(10, { mode: "both", percent: 75, fixed: 5 }),
    ).toBe(22.5);
  });
  it("percent_only", () => {
    expect(
      computeRetailPrice(10, { mode: "percent_only", percent: 50, fixed: 9 }),
    ).toBe(15);
  });
  it("fixed_only", () => {
    expect(
      computeRetailPrice(10, { mode: "fixed_only", percent: 99, fixed: 2.5 }),
    ).toBe(12.5);
  });
  it("none: cost, rounded to $0.50", () => {
    expect(
      computeRetailPrice(10.2, { mode: "none", percent: 0, fixed: 0 }),
    ).toBe(10);
  });
});
