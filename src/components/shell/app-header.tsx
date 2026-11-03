"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, PanelRightClose, PanelRightOpen } from "lucide-react";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  panelOpen: boolean;
  onTogglePanel: () => void;
  onBack?: () => void;
  backLabel?: string;
};

export function AppHeader({
  title,
  subtitle,
  panelOpen,
  onTogglePanel,
  onBack,
  backLabel = "Back",
}: AppHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-card/40 px-4">
      <div className="flex min-w-0 items-center gap-2">
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={backLabel}
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
          </Button>
        ) : null}
        <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold">{title}</h1>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={panelOpen ? "Close details panel" : "Open details panel"}
        aria-pressed={panelOpen}
        onClick={onTogglePanel}
      >
        {panelOpen ? (
          <PanelRightClose className="size-4" />
        ) : (
          <PanelRightOpen className="size-4" />
        )}
      </Button>
    </header>
  );
}
