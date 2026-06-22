import { createSignal, type JSX } from "solid-js";
import PanelHeader from "./PanelHeader";
import PanelNav from "./PanelNav";

export interface PanelShellProps {
  siteName: string;
  publicSiteUrl: string;
  logoutUrl: string;
  children: JSX.Element;
}

// Owns mobile sidebar open/close state — the only state PanelNav/
// PanelHeader need to coordinate on. Theme (`data-theme`) is owned
// globally by <BrandColorProvider> in __root.tsx, not duplicated here.
export default function PanelShell(props: PanelShellProps): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  return (
    <div class="lg:flex lg:min-h-screen">
      <PanelNav
        siteName={props.siteName}
        logoutUrl={props.logoutUrl}
        open={sidebarOpen()}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
        class="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
        classList={{ "pointer-events-none opacity-0": !sidebarOpen() }}
      />

      <div class="flex min-h-screen flex-1 flex-col lg:min-h-0">
        <PanelHeader
          publicSiteUrl={props.publicSiteUrl}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <main class="page-wrap flex-1 px-4 py-6">{props.children}</main>
      </div>
    </div>
  );
}
