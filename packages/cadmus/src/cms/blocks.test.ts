import { describe, expect, it } from "vitest";
import {
  createBlockRegistry,
  renderBlocksToString,
  type StringBlockRenderer,
} from "./blocks.js";

interface DemoBlock {
  type: string;
  heading?: string;
}

describe("createBlockRegistry", () => {
  it("registers, looks up, and reports types in registration order", () => {
    const reg = createBlockRegistry<StringBlockRenderer<DemoBlock>>({
      divider: () => "<hr>",
    });
    reg.register("hero", (b) => `<h1>${b.heading}</h1>`);

    expect(reg.has("hero")).toBe(true);
    expect(reg.has("missing")).toBe(false);
    expect(reg.types()).toEqual(["divider", "hero"]);
    expect(reg.get("divider")?.({ type: "divider" })).toBe("<hr>");
  });

  it("registerMany adds several and register replaces", () => {
    const reg = createBlockRegistry<StringBlockRenderer<DemoBlock>>();
    reg.registerMany({
      a: () => "A",
      b: () => "B",
    });
    expect(reg.types()).toEqual(["a", "b"]);
    reg.register("a", () => "A2");
    expect(reg.get("a")?.({ type: "a" })).toBe("A2");
  });

  it("resolve falls back when a type is unregistered", () => {
    const reg = createBlockRegistry<StringBlockRenderer<DemoBlock>>(
      {},
      { fallback: () => "<!-- unknown -->" },
    );
    expect(reg.resolve("anything")?.({ type: "anything" })).toBe(
      "<!-- unknown -->",
    );
    reg.setFallback(() => "FB");
    expect(reg.resolve("x")?.({ type: "x" })).toBe("FB");
  });
});

describe("renderBlocksToString", () => {
  const reg = createBlockRegistry<StringBlockRenderer<DemoBlock>>({
    divider: () => "<hr>",
    hero: (b) => `<h1>${b.heading}</h1>`,
  });

  it("renders blocks in order via their registered renderers", () => {
    const html = renderBlocksToString(
      [{ type: "hero", heading: "Hi" }, { type: "divider" }],
      reg,
    );
    expect(html).toBe("<h1>Hi</h1><hr>");
  });

  it("adding a new block type needs only a register call (no central switch)", () => {
    reg.register("badge", (b) => `<span>${b.heading}</span>`);
    const html = renderBlocksToString([{ type: "badge", heading: "New" }], reg);
    expect(html).toBe("<span>New</span>");
  });

  it("unknown types with no fallback contribute empty string", () => {
    const html = renderBlocksToString([{ type: "nope" }], reg);
    expect(html).toBe("");
  });
});
