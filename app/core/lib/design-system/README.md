# Design system

Cadmea's design system layers DaisyUI v5 theme presets, an owner-chosen
brand color, and spacing/type tokens into one CSS cascade — rendered
server-side on the public site (no FOUC) and replicated client-side in the
Panel and the design-settings live preview. See [issue #5](https://github.com/bowenlabs/project-thebes/issues/5)
(Phase 4) for the milestones this implements.

## How the cascade works

```
1. Theme CSS file   →  public/themes/theme-{name}.css, loaded via <link>,
                        activated by data-theme="theme-{name}" on <html>.
                        Dark mode is a separate `.dark` class — never read
                        data-theme to mean dark/light (see "data-theme is
                        reserved" below).
2. Brand color scale →  generateColorScale(brandColor) produces an 11-stop
                        OKLCH ramp; buildTokenStyle() writes DaisyUI's own
                        --color-primary/-content (and -secondary/-accent
                        for secondaryColor/tertiaryColor) from the ramp's
                        500 stop, inside a [data-theme="theme-{name}"]
                        override block — source order wins over the <link>.
3. Spacing/type      →  resolveSpacingTokens() / resolveTypeTokens() write
                        --spacing-*, --d-*, --text-*, --leading-*,
                        --tracking-* to :root.
4. Structural slots  →  SiteSettings's navBackground/footerBackground/
                        pageBackground/etc. map to specific CSS vars,
                        same override block as step 2.
```

`build-token-style.ts`'s `buildTokenStyle()` is the single implementation
of steps 2–4 — it's called from three places that each apply it
differently:

| Caller | Where | Output target |
|---|---|---|
| `layout.astro` | `app/workers/site/src/layouts/layout.astro` | server-rendered `<style>`, before first paint |
| `BrandColorProvider` | `app/workers/cadmea/src/components/BrandColorProvider.tsx` | client `<style>`, on mount + reactive updates |
| `preview-token-listener.ts` | `app/workers/site/src/scripts/preview-token-listener.ts` | client `<style>`, on `cadmea:token-update` postMessage |

## `data-theme` is reserved for the theme preset

`data-theme="theme-{name}"` (e.g. `theme-citadel`) names the active theme
preset. It is never repurposed to mean dark/light mode — that's a separate
`.dark` class on `<html>`, controlled independently (`ThemeToggle.tsx` in
the Panel, the `prefers-color-scheme` media query on the public site).
Mixing the two previously caused a real bug in this codebase (Cadmea's
dark-mode toggle wrote `data-theme="dark"` before `BrandColorProvider`
existed) — see DECISIONS.md's Phase 4 entry. If you're adding a new
consumer of `data-theme`, this is the constraint to not break.

## Theme presets

Six DaisyUI v5 themes, duplicated in both Workers' `public/themes/`
(`app/workers/site/public/themes/` and `app/workers/cadmea/public/themes/`
— Cloudflare Workers don't share static assets, so edit both when changing
a theme file):

| Preset | Character | Display font | Body font |
|---|---|---|---|
| `citadel` | Warm blue, editorial (default) | Hepta Slab | Roboto Flex |
| `noir` | Near-black, aubergine cast, hard edges | Syne | DM Sans |
| `adobe` | Kiln-fired terracotta, rounded | EB Garamond | Spline Sans |
| `flint` | Cool slate-blue, blueprint precision | Source Serif 4 | Source Sans 3 |
| `sage` | Deep olive, mossy, pebble-round | Fraunces | Mulish |
| `blank-canvas` | Zero chroma — swap one token and own it | Nunito | Nunito Sans |

`ThemePreset` / `THEME_PRESET_LIST` live in `theme-presets.ts`. Each theme
file sets DaisyUI v5's real token names — `--color-base-100/200/300`,
`--color-base-content`, `--color-primary/secondary/accent/neutral` (each
with a `-content` pair), `--color-info/success/warning/error` (+content),
`--radius-selector/field/box`, `--size-selector/field`, `--border`,
`--depth`, `--noise` — plus Cadmea's own extension tokens for things
DaisyUI doesn't define: `--font-display-face`, `--font-body-face`,
`--font-weight-display`, `--font-weight-body`.

**DaisyUI v4 used different names** (`--p`, `--pc`, etc.) — using those by
mistake produces no error, just a silently-ignored CSS variable. See
DECISIONS.md's 2026-06-19 entry for the exact incident this caused. When
in doubt, check the generated build output for the actual class definition
(`.bg-primary { background-color: var(--color-primary); }`), not docs or
memory.

## Font pairings

Seven pairings in `font-pairing.ts`: `classic`, `modern`, `artisan`,
`bold`, `soft`, `citadel`, `literary`. Each has a Google Fonts
`importUrl` (intercepted at the edge by Cloudflare Fonts — never link to
`fonts.cloudflare.com` directly) plus `displayFamily`/`bodyFamily` CSS
stacks. `getFontConfig(pairing)` resolves a `SiteSettings.fontPairing`
value to its config, falling back to `classic`.

## Spacing and type tokens

Three spacing presets (`compact`/`balanced`/`airy`) in `spacing-presets.ts`
control both public-site layout density and Panel chrome density
(`--d-*` tokens) from the same setting. Type-scale defaults live in
`type-defaults.ts`; `SiteSettings.typeTokens` (JSON) can override
individual values, merged via `resolveTypeTokens()`.

## Adding a new theme preset

1. Create `theme-{name}.css` in **both** Workers' `public/themes/`
   directories, using the DaisyUI v5 token list above as a template (copy
   `theme-citadel.css` as a starting point).
2. Add the key to `ThemePreset` and `THEME_PRESET_LIST` in `theme-presets.ts`.
3. Add the option to `SiteSettings.theme`'s allowed values wherever that's
   surfaced in the Panel UI (no settings-editing UI exists yet — see the
   "Scope boundary" note in DECISIONS.md's Phase 4 entry).

## What this phase didn't build

The Panel's actual design-settings *editing* UI (theme picker, brand-color
picker, font-pairing picker, spacing/type editors, live preview pane) is
out of scope for Phase 4 — it depends on `@bowenlabs/cadmea`'s
`CollectionEdit` supporting more field types than `text`/`select`/`number`/
`date`. This phase built the rendering/cascade infrastructure only; the
verification page at `app/workers/site/src/pages/token-test.astro` is a
manual test fixture, not the real settings UI.
