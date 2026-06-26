// Copyright (c) 2026 BowenLabs. All rights reserved.
// MIT licensed. See LICENSE in the repo root.
//
// Printful catalog + pricing — the studio-side surface this plugin's
// fulfillment provider (provider.ts) deliberately doesn't cover. Extracted
// from the themidwestartist.com site (issue #11) so any Cadmea store can
// reuse the catalog browser + cost→retail price math without re-porting it.
// Pure (Printful v2 REST + arithmetic); the consumer owns where settings are
// stored and how prices map onto its own product model.

const PRINTFUL_V2_BASE = "https://api.printful.com/v2";

export interface PrintfulCatalogClient {
  fetch<T = unknown>(path: string, init?: RequestInit): Promise<T>;
}

/** Bearer-authed Printful v2 client (catalog + variant prices). */
export function createPrintfulCatalogClient(
  apiKey: string,
): PrintfulCatalogClient {
  return {
    async fetch<T>(path: string, init?: RequestInit): Promise<T> {
      const res = await fetch(`${PRINTFUL_V2_BASE}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...init?.headers,
        },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Printful ${path} → ${res.status}: ${text}`);
      }
      return res.json() as Promise<T>;
    },
  };
}

export type MarkupMode = "percent_only" | "fixed_only" | "both" | "none";

export interface MarkupConfig {
  mode: MarkupMode;
  /** e.g. 75 = +75%. */
  percent: number;
  /** e.g. 5 = +$5.00. */
  fixed: number;
}

interface VariantPricesResponse {
  data?: { variant?: { techniques?: Array<{ price?: string }> } };
}

/** Manufacturing cost (major currency units, e.g. USD) for a catalog variant. */
export async function fetchVariantCost(
  client: PrintfulCatalogClient,
  variantId: number,
): Promise<number> {
  const res = await client.fetch<VariantPricesResponse>(
    `/catalog-variants/${variantId}/prices`,
  );
  const price = res.data?.variant?.techniques?.[0]?.price;
  if (!price) throw new Error(`No price data for variant ${variantId}`);
  return Number.parseFloat(price);
}

/**
 * Retail price from a manufacturing cost + markup, rounded to the nearest
 * $0.50 — the source app's formula.
 */
export function computeRetailPrice(cost: number, markup: MarkupConfig): number {
  let raw: number;
  switch (markup.mode) {
    case "percent_only":
      raw = cost + cost * (markup.percent / 100);
      break;
    case "fixed_only":
      raw = cost + markup.fixed;
      break;
    case "both":
      raw = cost + cost * (markup.percent / 100) + markup.fixed;
      break;
    default:
      raw = cost;
  }
  return Math.round(raw * 2) / 2;
}

/** Search/list catalog products (Printful v2 `/catalog-products`). */
export async function searchCatalogProducts(
  client: PrintfulCatalogClient,
  query?: string,
  limit = 50,
): Promise<{ products: unknown[]; total: number }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query) params.set("search", query);
  const res = await client.fetch<{
    data: unknown[];
    paging?: { total: number };
  }>(`/catalog-products?${params}`);
  return { products: res.data, total: res.paging?.total ?? 0 };
}

/** Variants for one catalog product. */
export async function listCatalogVariants(
  client: PrintfulCatalogClient,
  productId: number,
): Promise<unknown[]> {
  const res = await client.fetch<{ data: unknown[] }>(
    `/catalog-products/${productId}/catalog-variants?limit=100`,
  );
  return res.data;
}
