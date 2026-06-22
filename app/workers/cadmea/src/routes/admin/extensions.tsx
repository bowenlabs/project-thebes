import { createFileRoute } from "@tanstack/solid-router";

export const prerender = false;

export const Route = createFileRoute("/admin/extensions")({
  component: ExtensionsPage,
});

// Static coming-soon list — Extensions are Section 3+ (see CLAUDE.md
// "Naming"). No real extension exists yet to drive this page from data.
const comingSoon = [
  {
    name: "Square e-commerce",
    description: "Storefront, checkout, and order management on Square.",
  },
  {
    name: "Cloudflare Images",
    description: "Server-side resizing and on-the-fly image transforms.",
  },
];

function ExtensionsPage() {
  return (
    <div class="flex flex-col gap-4">
      <p class="m-0 text-sm text-[var(--sea-ink-soft)]">
        Extensions add optional functionality on top of Cadmea core. None are
        available yet — here's what's planned.
      </p>

      <ul class="m-0 grid gap-3 p-0 sm:grid-cols-2">
        {comingSoon.map((extension) => (
          <li class="list-none rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <p class="m-0 flex items-center gap-2 text-sm font-semibold">
              {extension.name}
              <span class="island-kicker">Coming soon</span>
            </p>
            <p class="m-0 mt-1 text-sm text-[var(--sea-ink-soft)]">
              {extension.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
