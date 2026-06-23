// WCAG 2.1 relative luminance and contrast ratio.
// https://www.w3.org/TR/WCAG21/#dfn-relative-luminance

function linearize(val: number): number {
  const s = val / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG AA: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt bold)
export function passesAA(hex1: string, hex2: string, large = false): boolean {
  return contrastRatio(hex1, hex2) >= (large ? 3 : 4.5);
}
