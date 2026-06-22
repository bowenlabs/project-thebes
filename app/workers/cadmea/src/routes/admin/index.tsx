import { createFileRoute, redirect } from "@tanstack/solid-router";

export const prerender = false;

// Bare /admin has no content of its own — send owners to the first nav
// item so the Panel never renders an empty shell.
export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/pages" });
  },
});
