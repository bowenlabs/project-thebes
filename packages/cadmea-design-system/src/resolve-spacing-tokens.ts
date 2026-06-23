import {
  SPACING_PRESETS,
  type SpacingPreset,
  type SpacingTokens,
} from "./spacing-presets.js";
import { TYPE_DEFAULTS, type TypeTokens } from "./type-defaults.js";

export function resolveSpacingTokens(
  preset: SpacingPreset | string | null | undefined,
): SpacingTokens {
  return (
    SPACING_PRESETS[(preset as SpacingPreset) ?? "balanced"] ??
    SPACING_PRESETS.balanced
  );
}

export function resolveTypeTokens(
  overrides: Partial<TypeTokens> | null | undefined,
): TypeTokens {
  const base = { ...TYPE_DEFAULTS };
  if (!overrides) return base;
  for (const key of Object.keys(base) as Array<keyof TypeTokens>) {
    const val = overrides[key];
    if (typeof val === "string" && val.trim() !== "") base[key] = val.trim();
  }
  return base;
}

// Spacing + type-scale tokens only — namespace-clean, not DaisyUI color
// tokens, so no DaisyUI-specific renaming needed (unlike build-token-style.ts).
export function buildSpacingTokenStyles(
  spacing: SpacingTokens,
  type: TypeTokens,
): string {
  return [
    `  --spacing-section-y:   ${spacing.sectionPaddingY};`,
    `  --spacing-card-x:      ${spacing.cardPaddingX};`,
    `  --spacing-card-y:      ${spacing.cardPaddingY};`,
    `  --spacing-grid-gap:    ${spacing.gridGap};`,
    `  --spacing-stack-gap:   ${spacing.stackGap};`,
    `  --spacing-container-x: ${spacing.containerPaddingX};`,
    // Panel density tokens
    `  --d-row:               ${spacing.rowHeight};`,
    `  --d-tight:             ${spacing.tightGap};`,
    `  --d-nav-w:             ${spacing.navWidth};`,
    `  --d-pad:               ${spacing.panelPad};`,
    `  --d-gap:               ${spacing.panelGap};`,
    `  --d-nav-pad-y:         ${spacing.navPadY};`,
    `  --d-text-base:         ${spacing.textBase};`,
    `  --d-h1:                ${spacing.h1};`,
    `  --d-h2:                ${spacing.h2};`,
    `  --d-eyebrow:           ${spacing.eyebrow};`,
    `  --d-sub:               ${spacing.sub};`,
    `  --text-xs:     ${type.textXs};`,
    `  --text-sm:     ${type.textSm};`,
    `  --text-base:   ${type.textBase};`,
    `  --text-lg:     ${type.textLg};`,
    `  --text-xl:     ${type.textXl};`,
    `  --text-2xl:    ${type.text2xl};`,
    `  --text-3xl:    ${type.text3xl};`,
    `  --text-4xl:    ${type.text4xl};`,
    `  --text-5xl:    ${type.text5xl};`,
    `  --leading-tight:   ${type.leadingTight};`,
    `  --leading-snug:    ${type.leadingSnug};`,
    `  --leading-normal:  ${type.leadingNormal};`,
    `  --leading-relaxed: ${type.leadingRelaxed};`,
    `  --leading-loose:   ${type.leadingLoose};`,
    `  --tracking-tight:   ${type.trackingTight};`,
    `  --tracking-normal:  ${type.trackingNormal};`,
    `  --tracking-wide:    ${type.trackingWide};`,
    `  --tracking-widest:  ${type.trackingWidest};`,
  ].join("\n");
}
