import {
  buildTokenStyle,
  type TokenStyleInput,
} from "@core/lib/design-system/build-token-style";
import { createEffect, createSignal, type JSX } from "solid-js";

export interface BrandColorProviderProps extends TokenStyleInput {
  darkMode?: boolean;
  children: JSX.Element;
}

function applyPanelTokens(
  props: BrandColorProviderProps,
  setActiveTheme: (t: string) => void,
) {
  const root = document.documentElement;
  const themeName = props.theme ?? "citadel";

  root.setAttribute("data-theme", `theme-${themeName}`);
  setActiveTheme(themeName);

  let style = document.getElementById(
    "cadmea-panel-tokens",
  ) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = "cadmea-panel-tokens";
    document.head.appendChild(style);
  }
  style.textContent = buildTokenStyle(props);
}

// Sole writer of `data-theme` in the Panel — see ThemeToggle.tsx and
// __root.tsx's comments on the naming collision this resolves. Mounted in
// __root.tsx wrapping the route tree, fed by the getCadmeaSiteSettings
// server function.
export default function BrandColorProvider(props: BrandColorProviderProps) {
  const [activeTheme, setActiveTheme] = createSignal(props.theme ?? "citadel");

  createEffect(() => {
    applyPanelTokens(props, setActiveTheme);
  });

  return (
    <>
      <link rel="stylesheet" href={`/themes/theme-${activeTheme()}.css`} />
      {props.children}
    </>
  );
}
