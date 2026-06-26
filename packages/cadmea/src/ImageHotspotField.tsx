// Copyright (c) 2026 BowenLabs. All rights reserved.
// Cadmea is MIT licensed. See LICENSE in the repo root.

import type { ImageCrop, ImageHotspot } from "@thebes/cadmus/storage";
import { createMemo, createSignal, Show } from "solid-js";

/**
 * Image hotspot/crop editor widget (issue #17). A custom field widget for
 * `upload` image fields: upload an image, then click it to set the focal
 * point (hotspot) and optionally enter a crop region. Stores the value as a
 * JSON string `{ url, hotspot?, crop? }` in the same column (back-compatible
 * — a plain URL string still parses). Pair with `ImageService.render`'s
 * `hotspot`/`crop` args on the read side (see @thebes/cadmus-cloudflare-images).
 *
 * Register it via `createCollectionEditPage`/`CollectionEdit`'s `fieldWidgets`
 * option, keyed by the field name.
 */

export interface ImageWithHotspot {
  url: string;
  hotspot?: ImageHotspot;
  crop?: ImageCrop;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/**
 * Parse an upload-field value into `{ url, hotspot?, crop? }`. Accepts the
 * JSON object this widget writes, an already-parsed object, or a bare URL
 * string (legacy / non-hotspot uploads). Returns null for empty values.
 */
export function parseImageHotspotValue(
  value: unknown,
): ImageWithHotspot | null {
  if (!value) return null;
  if (typeof value === "object") return value as ImageWithHotspot;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{")) {
      try {
        return JSON.parse(trimmed) as ImageWithHotspot;
      } catch {
        // fall through to treating it as a plain URL
      }
    }
    return trimmed ? { url: trimmed } : null;
  }
  return null;
}

/** Serialize an {@link ImageWithHotspot} for storage in an upload field. */
export function serializeImageHotspotValue(value: ImageWithHotspot): string {
  return JSON.stringify(value);
}

/** Props every `fieldWidgets` widget receives from CollectionEdit. */
export interface FieldWidgetProps {
  fieldKey: string;
  value: unknown;
  setValue: (value: unknown) => void;
  onUploadFile?: (file: File) => Promise<{ url: string }>;
}

export function ImageHotspotField(props: FieldWidgetProps) {
  const parsed = createMemo(() => parseImageHotspotValue(props.value));
  const [uploading, setUploading] = createSignal(false);
  const [error, setError] = createSignal<string>();

  const patch = (next: Partial<ImageWithHotspot>) => {
    const current = parsed() ?? { url: "" };
    props.setValue(serializeImageHotspotValue({ ...current, ...next }));
  };

  async function handleFile(e: Event & { currentTarget: HTMLInputElement }) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    if (!props.onUploadFile) {
      setError("No upload handler configured for this form.");
      return;
    }
    setUploading(true);
    setError(undefined);
    try {
      const { url } = await props.onUploadFile(file);
      patch({ url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleImageClick(
    e: MouseEvent & { currentTarget: HTMLImageElement },
  ) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);
    patch({ hotspot: { x: round2(x), y: round2(y) } });
  }

  const crop = () => parsed()?.crop ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const setCrop = (edge: keyof ImageCrop, raw: string) => {
    patch({ crop: { ...crop(), [edge]: clamp01(Number(raw) || 0) } });
  };

  return (
    <div class="flex flex-col gap-3">
      <input
        id={props.fieldKey}
        class="file-input"
        type="file"
        accept="image/*"
        disabled={uploading()}
        onChange={handleFile}
      />
      <Show when={uploading()}>
        <span class="loading loading-spinner loading-sm" />
      </Show>
      <Show when={error()}>
        <p class="text-sm text-error">{error()}</p>
      </Show>

      <Show when={parsed()?.url}>
        {(url) => (
          <div class="flex flex-col gap-2">
            <p class="text-xs opacity-60">
              Click the image to set the focal point.
            </p>
            <div class="relative inline-block max-w-md">
              {/* biome-ignore lint/a11y/noStaticElementInteractions: the image is the hotspot-picking surface */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: pointer-based focal-point picker; numeric inputs below are the keyboard-accessible path */}
              <img
                src={url()}
                alt="Set focal point"
                class="block w-full cursor-crosshair rounded"
                onClick={handleImageClick}
              />
              <Show when={parsed()?.hotspot}>
                {(hs) => (
                  <span
                    class="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--accent,#56c6be)] shadow"
                    style={{
                      left: `${hs().x * 100}%`,
                      top: `${hs().y * 100}%`,
                    }}
                  />
                )}
              </Show>
            </div>

            <details class="text-sm">
              <summary class="cursor-pointer opacity-70">
                Crop (advanced)
              </summary>
              <div class="mt-2 grid grid-cols-4 gap-2">
                {(["top", "right", "bottom", "left"] as const).map((edge) => (
                  <label class="flex flex-col gap-1 text-xs">
                    <span class="capitalize opacity-70">{edge}</span>
                    <input
                      class="input input-sm"
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={crop()[edge]}
                      onInput={(e) => setCrop(edge, e.currentTarget.value)}
                    />
                  </label>
                ))}
              </div>
            </details>

            <p class="break-all text-xs opacity-50">{url()}</p>
          </div>
        )}
      </Show>
    </div>
  );
}
