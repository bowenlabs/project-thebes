import { describe, expect, it, vi } from "vitest";
import { createCloudflareImageService } from "./index.js";

// NOTE: import only deep cadmus paths (./storage) here, never the package
// root — the root re-exports the email primitive, which imports the
// Workers-only `cloudflare:email` module and breaks plain-node vitest.

const ORIGINAL = "https://media.example.com/abc.png";

function service(overrides = {}) {
  return createCloudflareImageService({
    // a put-only stub is all render/upload exercise
    bucket: { put: vi.fn(async () => undefined) } as unknown as R2Bucket,
    mediaUrl: "https://media.example.com",
    ...overrides,
  });
}

describe("createCloudflareImageService — render", () => {
  it("returns a /cdn-cgi/image transform URL with format and quality", () => {
    const { src } = service().render({ url: ORIGINAL, alt: "x" });
    expect(src).toContain("/cdn-cgi/image/");
    expect(src).toContain("format=auto");
    expect(src).toContain("quality=80");
    expect(src).toContain(ORIGINAL);
  });

  it("emits a responsive srcset across the configured widths plus sizes", () => {
    const out = service({ widths: [320, 640] }).render({
      url: ORIGINAL,
      alt: "x",
    });
    expect(out.srcset).toContain("width=320");
    expect(out.srcset).toContain("320w");
    expect(out.srcset).toContain("width=640");
    expect(out.srcset).toContain("640w");
    expect(out.sizes).toBe("100vw");
  });

  it("pins a single rendition (no srcset) when width or height is given", () => {
    const out = service().render({ url: ORIGINAL, width: 200, alt: "x" });
    expect(out.src).toContain("width=200");
    expect(out.srcset).toBeUndefined();
  });

  it("uses deliveryUrl for transforms while keeping the original as source", () => {
    const out = service({ deliveryUrl: "https://img.example.com" }).render({
      url: ORIGINAL,
      alt: "x",
    });
    expect(out.src.startsWith("https://img.example.com/cdn-cgi/image/")).toBe(
      true,
    );
    expect(out.src).toContain(ORIGINAL);
  });

  it("honors a custom quality and sizes", () => {
    const out = service({ quality: 60, sizes: "50vw", widths: [400] }).render({
      url: ORIGINAL,
      alt: "x",
    });
    expect(out.src).toContain("quality=60");
    expect(out.sizes).toBe("50vw");
  });
});

describe("createCloudflareImageService — upload", () => {
  it("puts the file in R2 and returns the original media URL", async () => {
    const put = vi.fn(async () => undefined);
    const svc = createCloudflareImageService({
      bucket: { put } as unknown as R2Bucket,
      mediaUrl: "https://media.example.com",
    });

    const file = new File(["data"], "photo.png", { type: "image/png" });
    const { url } = await svc.upload(file);

    expect(put).toHaveBeenCalledTimes(1);
    // returns the ORIGINAL url (not a transform url), under mediaUrl
    expect(url.startsWith("https://media.example.com/")).toBe(true);
    expect(url).toContain(".png");
    expect(url).not.toContain("/cdn-cgi/image/");
  });

  it("rejects a non-image file before touching R2", async () => {
    const put = vi.fn(async () => undefined);
    const svc = createCloudflareImageService({
      bucket: { put } as unknown as R2Bucket,
      mediaUrl: "https://media.example.com",
    });

    const file = new File(["data"], "notes.txt", { type: "text/plain" });
    // validateImageFile throws CadmusStorageError("Unsupported file type…")
    await expect(svc.upload(file)).rejects.toThrow(/Unsupported file type/);
    expect(put).not.toHaveBeenCalled();
  });
});
