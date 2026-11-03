"use client";

import { useState } from "react";
import { SideNav } from "@/components/shell/side-nav";
import { AppHeader } from "@/components/shell/app-header";
import { ContextPanel } from "@/components/shell/context-panel";

type AppShellProps = {
  targetEmail: string | null;
  connectionOk: boolean;
  headerTitle: string;
  headerSubtitle?: string;
  panelTitle?: string;
  panelOpen?: boolean;
  onPanelOpenChange?: (open: boolean) => void;
  panelContent?: React.ReactNode;
  onHeaderBack?: () => void;
  headerBackLabel?: string;
  children: React.ReactNode;
};

export function AppShell({
  targetEmail,
  connectionOk,
  headerTitle,
  headerSubtitle,
  panelTitle,
  panelOpen: panelOpenProp,
  onPanelOpenChange,
  panelContent,
  onHeaderBack,
  headerBackLabel,
  children,
}: AppShellProps) {
  const [panelOpenInternal, setPanelOpenInternal] = useState(false);
  const panelOpen = panelOpenProp ?? panelOpenInternal;
  const setPanelOpen = onPanelOpenChange ?? setPanelOpenInternal;

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden">
      <SideNav targetEmail={targetEmail} connectionOk={connectionOk} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen(!panelOpen)}
          onBack={onHeaderBack}
          backLabel={headerBackLabel}
        />
        <div className="flex min-h-0 flex-1">
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background">
            {children}
          </main>
          {panelContent ? (
            <ContextPanel
              open={panelOpen}
              onClose={() => setPanelOpen(false)}
              title={panelTitle}
            >
              {panelContent}
            </ContextPanel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
