import type { CollectionConfig } from "@bowenlabs/cadmus/cms";
import { createQuery } from "@tanstack/solid-query";
import { Link } from "@tanstack/solid-router";
import { Show } from "solid-js";
import { CollectionList } from "../CollectionList.js";

export interface CollectionListPageOptions<
  TRow extends Record<string, unknown>,
> {
  collection: CollectionConfig;
  /** Page heading — e.g. "Pages". Defaults to the collection slug. */
  label?: string;
  queryKey: readonly unknown[];
  queryFn: () => Promise<TRow[]>;
  /** Link href for the "New …" button. Omit to hide the button entirely. */
  newHref?: string;
  /** Label for the "New …" button — e.g. "New page". */
  newLabel?: string;
  /** Called when a row is clicked — wire this to your router's navigate(). */
  onRowClick?: (row: TRow) => void;
}

/**
 * Builds a list-view page component for a collection — query, loading
 * state, and the generic table, wired together. The returned component
 * is meant to be passed directly as a route's `component`:
 *
 * ```tsx
 * export const Route = createFileRoute('/admin/pages/')({
 *   component: createCollectionListPage({
 *     collection: pagesCollection,
 *     label: 'Pages',
 *     queryKey: ['pages'],
 *     queryFn: () => getPages(),
 *     newHref: '/admin/pages/new',
 *     newLabel: 'New page',
 *     onRowClick: (row) => navigate({ to: '/admin/pages/$pageId', params: { pageId: String(row.id) } }),
 *   }),
 * })
 * ```
 *
 * Navigation stays in the route file (via `onRowClick`/`newHref` as plain
 * strings) rather than this package calling `useNavigate()` itself —
 * TanStack Router's route-typing is generated per-app, so a generic
 * package can't produce a correctly-typed `navigate()` call for routes
 * it doesn't know about.
 */
export function createCollectionListPage<TRow extends Record<string, unknown>>(
  options: CollectionListPageOptions<TRow>,
) {
  return function CollectionListPage() {
    const rows = createQuery(() => ({
      queryKey: options.queryKey,
      queryFn: options.queryFn,
    }));

    return (
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-semibold">
            {options.label ?? options.collection.slug}
          </h1>
          <Show when={options.newHref}>
            <Link to={options.newHref} class="btn btn-primary btn-sm">
              {options.newLabel ?? `New ${options.collection.slug}`}
            </Link>
          </Show>
        </div>
        <Show
          when={!rows.isLoading}
          fallback={<div class="loading loading-spinner" />}
        >
          <CollectionList
            config={options.collection}
            rows={rows.data ?? []}
            onRowClick={
              options.onRowClick as
                | ((row: Record<string, unknown>) => void)
                | undefined
            }
          />
        </Show>
      </div>
    );
  };
}
