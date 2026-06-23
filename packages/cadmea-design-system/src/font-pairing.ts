export type FontPairingKey =
  | "classic"
  | "modern"
  | "artisan"
  | "bold"
  | "soft"
  | "citadel"
  | "literary";

export interface FontConfig {
  importUrl: string;
  displayFamily: string;
  bodyFamily: string;
}

const FONT_CONFIGS: Record<FontPairingKey, FontConfig> = {
  classic: {
    importUrl:
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap",
    displayFamily: "'Playfair Display', Georgia, serif",
    bodyFamily: "'Source Serif 4', Georgia, serif",
  },
  modern: {
    importUrl:
      "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&family=Nunito+Sans:ital,wght@0,400;0,600;1,400&display=swap",
    displayFamily: "'Nunito', system-ui, sans-serif",
    bodyFamily: "'Nunito Sans', system-ui, sans-serif",
  },
  artisan: {
    importUrl:
      "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Spline+Sans:wght@400;500;600&display=swap",
    displayFamily: "'EB Garamond', Georgia, serif",
    bodyFamily: "'Spline Sans', system-ui, sans-serif",
  },
  bold: {
    importUrl:
      "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap",
    displayFamily: "'Syne', system-ui, sans-serif",
    bodyFamily: "'DM Sans', system-ui, sans-serif",
  },
  soft: {
    importUrl:
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Mulish:wght@400;500;600&display=swap",
    displayFamily: "'Fraunces', Georgia, serif",
    bodyFamily: "'Mulish', system-ui, sans-serif",
  },
  citadel: {
    importUrl:
      "https://fonts.googleapis.com/css2?family=Hepta+Slab:wght@400;500;800&family=Roboto+Flex:opsz,wght@8..144,300;8..144,400;8..144,500&display=swap",
    displayFamily: "'Hepta Slab', 'Roboto Slab', Georgia, serif",
    bodyFamily: "'Roboto Flex', system-ui, sans-serif",
  },
  literary: {
    importUrl:
      "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&display=swap",
    displayFamily: "'Source Serif 4', 'Iowan Old Style', Georgia, serif",
    bodyFamily: "'Source Sans 3', system-ui, sans-serif",
  },
};

export function getFontConfig(pairing: string | null | undefined): FontConfig {
  return (
    FONT_CONFIGS[(pairing as FontPairingKey) ?? "classic"] ??
    FONT_CONFIGS.classic
  );
}

// Google Fonts URL segments keyed by CSS family name (for override font picker)
const GOOGLE_FONT_MAP: Record<string, string> = {
  "Playfair Display": "Playfair+Display:ital,wght@0,400;0,600;0,700;1,400",
  Fraunces: "Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400",
  Lora: "Lora:ital,wght@0,400;0,600;1,400",
  Syne: "Syne:wght@600;700;800",
  "Hepta Slab": "Hepta+Slab:wght@400;500;800",
  "Roboto Flex": "Roboto+Flex:opsz,wght@8..144,300;8..144,400;8..144,500",
  "EB Garamond": "EB+Garamond:ital,wght@0,400;0,500;0,600;1,400",
  "Spline Sans": "Spline+Sans:wght@400;500;600",
  Cormorant: "Cormorant:ital,wght@0,400;0,600;1,400",
  Merriweather: "Merriweather:ital,wght@0,400;0,700;1,400",
  "Libre Baskerville": "Libre+Baskerville:wght@400;700",
  "DM Sans": "DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;1,9..40,400",
  Inter: "Inter:wght@400;500;600",
  Mulish: "Mulish:wght@400;500;600",
  Nunito: "Nunito:wght@400;500;600;700",
  "Nunito Sans": "Nunito+Sans:ital,wght@0,400;0,600;1,400",
  "Source Serif 4":
    "Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400",
  "Source Sans 3": "Source+Sans+3:ital,wght@0,400;0,600;1,400",
  Raleway: "Raleway:wght@400;500;600",
  "Work Sans": "Work+Sans:wght@400;500;600",
  Outfit: "Outfit:wght@400;500;600",
};

function extractFamilyName(cssStack: string): string {
  return cssStack.replace(/^["']/, "").split(/["',]/)[0].trim();
}

// Build a Google Fonts URL for just the override fonts
export function buildOverrideFontUrl(
  displayOverride?: string | null,
  bodyOverride?: string | null,
): string | null {
  const segments = [displayOverride, bodyOverride]
    .filter(Boolean)
    .map((s) => GOOGLE_FONT_MAP[extractFamilyName(s as string)])
    .filter(Boolean);
  const unique = [...new Set(segments)];
  if (unique.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${unique.map((f) => `family=${f}`).join("&")}&display=swap`;
}

// Build a Google Fonts URL for all available fonts — used in the Panel so
// font previews render without additional network round-trips.
export function buildAllFontsUrl(): string {
  const unique = [...new Set(Object.values(GOOGLE_FONT_MAP))];
  return `https://fonts.googleapis.com/css2?${unique.map((f) => `family=${f}`).join("&")}&display=swap`;
}
