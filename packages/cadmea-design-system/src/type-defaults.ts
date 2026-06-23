export interface TypeTokens {
  textXs: string;
  textSm: string;
  textBase: string;
  textLg: string;
  textXl: string;
  text2xl: string;
  text3xl: string;
  text4xl: string;
  text5xl: string;
  leadingTight: string;
  leadingSnug: string;
  leadingNormal: string;
  leadingRelaxed: string;
  leadingLoose: string;
  trackingTight: string;
  trackingNormal: string;
  trackingWide: string;
  trackingWidest: string;
}

export const TYPE_DEFAULTS: TypeTokens = {
  textXs: "0.75rem",
  textSm: "0.875rem",
  textBase: "1rem",
  textLg: "1.125rem",
  textXl: "1.25rem",
  text2xl: "1.5rem",
  text3xl: "1.875rem",
  text4xl: "2.25rem",
  text5xl: "3rem",
  leadingTight: "1.25",
  leadingSnug: "1.375",
  leadingNormal: "1.5",
  leadingRelaxed: "1.625",
  leadingLoose: "2",
  trackingTight: "-0.025em",
  trackingNormal: "0em",
  trackingWide: "0.025em",
  trackingWidest: "0.1em",
};
