// OKLCH-based color scale generator. Given a hex brand color, produces
// CSS-ready OKLCH values for --color-50 through --color-950.
import { contrastRatio, passesAA } from "./contrast.js";

export interface ColorScale {
  "50": string;
  "100": string;
  "200": string;
  "300": string;
  "400": string;
  "500": string;
  "600": string;
  "700": string;
  "800": string;
  "900": string;
  "950": string;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function linearize(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function delinearize(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.min(255, Math.max(0, Math.round(c * 255)));
}

function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
  const rl = linearize(r);
  const gl = linearize(g);
  const bl = linearize(b);

  // linear sRGB → XYZ (D65)
  const x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl;
  const z = 0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl;

  // XYZ → LMS (Oklab M1)
  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z);

  // LMS → Lab (Oklab M2)
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bv = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(a * a + bv * bv);
  const h = Math.atan2(bv, a) * (180 / Math.PI);

  return [L, C, h < 0 ? h + 360 : h];
}

// Inverse of rgbToOklch — needed by pickContentColor to check WCAG contrast
// against a generated OKLCH swatch (contrast.ts only operates on hex/sRGB).
function oklchToRgb(L: number, C: number, h: number): [number, number, number] {
  const hRad = (h * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const bv = C * Math.sin(hRad);

  // Lab → LMS (inverse Oklab M2)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * bv;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bv;
  const s_ = L - 0.0894841775 * a - 1.291485548 * bv;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS → XYZ (inverse Oklab M1)
  const x = 1.2270138511 * l - 0.5577999807 * m + 0.0281256149 * s;
  const y = -0.0405801784 * l + 1.1122568696 * m - 0.0716766787 * s;
  const z = -0.0763812845 * l - 0.4214819784 * m + 1.5861632204 * s;

  // XYZ → linear sRGB (D65)
  const rl = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const gl = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

  return [delinearize(rl), delinearize(gl), delinearize(bl)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function oklchToCss(L: number, C: number, h: number): string {
  return `oklch(${(L * 100).toFixed(2)}% ${C.toFixed(4)} ${h.toFixed(2)})`;
}

// Lightness stops for --color-50 through --color-950
const LIGHTNESS_STOPS: Record<keyof ColorScale, number> = {
  "50": 0.97,
  "100": 0.94,
  "200": 0.88,
  "300": 0.8,
  "400": 0.7,
  "500": 0.58,
  "600": 0.48,
  "700": 0.39,
  "800": 0.3,
  "900": 0.22,
  "950": 0.15,
};

export function generateColorScale(hex: string): ColorScale {
  const [r, g, b] = hexToRgb(hex);
  const [, C, h] = rgbToOklch(r, g, b);

  const entries = (
    Object.entries(LIGHTNESS_STOPS) as [keyof ColorScale, number][]
  ).map(
    ([stop, L]) => [stop, oklchToCss(L, C * (L > 0.5 ? 0.9 : 1.1), h)] as const,
  );
  return Object.fromEntries(entries) as unknown as ColorScale;
}

// DaisyUI v5 pairs every color role with a `-content` (text-on-color) token,
// and brand colors span a wide lightness range, so a fixed "always white"
// choice (fine for Louise's Preline ramp) would fail AA on light brand
// colors. Picks whichever of pure black/white actually clears WCAG AA
// against the given OKLCH swatch; falls back to the higher-contrast option
// if neither formally passes (rare, only at mid-lightness/high-chroma).
export function pickContentColor(oklchCss: string): string {
  const match = oklchCss.match(/oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match) return "oklch(100% 0 0)";
  const L = Number(match[1]) / 100;
  const C = Number(match[2]);
  const h = Number(match[3]);
  const [r, g, b] = oklchToRgb(L, C, h);
  const hex = rgbToHex(r, g, b);

  const black = "#000000";
  const white = "#ffffff";
  if (passesAA(hex, white)) return "oklch(100% 0 0)";
  if (passesAA(hex, black)) return "oklch(15% 0 0)";
  // Neither clears AA (rare — mid-lightness, high-chroma swatches) — pick
  // whichever of black/white has the higher ratio.
  const whiteRatio = contrastRatio(hex, white);
  const blackRatio = contrastRatio(hex, black);
  return whiteRatio >= blackRatio ? "oklch(100% 0 0)" : "oklch(15% 0 0)";
}
