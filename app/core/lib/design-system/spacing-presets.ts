export type SpacingPreset = "compact" | "balanced" | "airy";

export interface SpacingTokens {
  // Public site spacing
  sectionPaddingY: string;
  cardPaddingX: string;
  cardPaddingY: string;
  gridGap: string;
  stackGap: string;
  containerPaddingX: string;

  // Panel density (controlled by the same spacing preset)
  rowHeight: string; // nav items, table rows
  tightGap: string; // condensed spacing within components
  navWidth: string; // sidebar width
  panelPad: string; // main content area padding (--d-pad)
  panelGap: string; // grid gap between cards (--d-gap)
  navPadY: string; // extra vertical padding inside nav items
  textBase: string; // base font-size for panel chrome
  h1: string; // panel page heading size
  h2: string; // panel section heading size
  eyebrow: string; // eyebrow / label font size
  sub: string; // subtitle / secondary body text
}

export const SPACING_PRESETS: Record<SpacingPreset, SpacingTokens> = {
  compact: {
    sectionPaddingY: "3rem",
    cardPaddingX: "1rem",
    cardPaddingY: "0.75rem",
    gridGap: "1rem",
    stackGap: "1rem",
    containerPaddingX: "1rem",
    rowHeight: "36px",
    tightGap: "8px",
    navWidth: "224px",
    panelPad: "12px",
    panelGap: "12px",
    navPadY: "2px",
    textBase: "13px",
    h1: "24px",
    h2: "17px",
    eyebrow: "10px",
    sub: "12px",
  },
  balanced: {
    sectionPaddingY: "5rem",
    cardPaddingX: "1.5rem",
    cardPaddingY: "1.25rem",
    gridGap: "1.5rem",
    stackGap: "1.5rem",
    containerPaddingX: "1.5rem",
    rowHeight: "44px",
    tightGap: "10px",
    navWidth: "256px",
    panelPad: "20px",
    panelGap: "16px",
    navPadY: "4px",
    textBase: "14px",
    h1: "28px",
    h2: "20px",
    eyebrow: "11px",
    sub: "13px",
  },
  airy: {
    sectionPaddingY: "8rem",
    cardPaddingX: "2rem",
    cardPaddingY: "2rem",
    gridGap: "2.5rem",
    stackGap: "2.5rem",
    containerPaddingX: "2rem",
    rowHeight: "52px",
    tightGap: "14px",
    navWidth: "280px",
    panelPad: "20px",
    panelGap: "20px",
    navPadY: "6px",
    textBase: "15px",
    h1: "32px",
    h2: "22px",
    eyebrow: "12px",
    sub: "14px",
  },
};
