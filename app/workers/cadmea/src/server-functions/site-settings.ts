import { getSiteSettings } from "@core/lib/get-site-settings";
import { createServerFn } from "@tanstack/solid-start";

// Unlike server-functions/pages.ts, this is intentionally not behind
// requireAuthOrThrow — __root.tsx renders this for the pre-auth redirect
// path too (the Panel chrome itself, including the login-redirect screen,
// still needs a theme), and site_settings has no sensitive fields.
export const getCadmeaSiteSettings = createServerFn({ method: "GET" }).handler(
  async () => {
    const { env } = await import("cloudflare:workers");
    return getSiteSettings(env.DB);
  },
);
