import { useLocation } from "@tanstack/solid-router";
import type { JSX } from "solid-js";

export interface PanelHeaderProps {
  publicSiteUrl: string;
  onOpenSidebar: () => void;
}

// Derives a title from the first /admin/* path segment — forward-
// compatible with the generic /admin/collections/$slug route the CMS
// repositioning (issue #10's first comment) eventually replaces today's
// hand-built /admin/pages with.
function titleFromPathname(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[1];
  if (!segment) return "Panel";
  return segment[0].toUpperCase() + segment.slice(1);
}

export default function PanelHeader(props: PanelHeaderProps): JSX.Element {
  const location = useLocation();
  const title = () => titleFromPathname(location().pathname);

  return (
    <header class="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 py-3 backdrop-blur-lg">
      <button
        type="button"
        onClick={props.onOpenSidebar}
        aria-label="Open menu"
        aria-controls="panel-nav"
        class="rounded-xl p-2 text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] lg:hidden"
      >
        <i class="ph ph-list text-xl" aria-hidden="true" />
      </button>

      <h1 class="m-0 flex-1 text-lg font-semibold tracking-tight">{title()}</h1>

      <a
        href={props.publicSiteUrl}
        target="_blank"
        rel="noreferrer"
        class="inline-flex items-center gap-1.5 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
      >
        View live site
        <i class="ph ph-arrow-up-right text-base" aria-hidden="true" />
      </a>
    </header>
  );
}
