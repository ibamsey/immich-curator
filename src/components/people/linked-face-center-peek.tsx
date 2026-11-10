"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AssetPreviewModal,
  type AssetPreviewTarget,
} from "@/components/grid/asset-preview-modal";
import type { ImmichPerson } from "@/lib/immich/types";

/** Matches `SideNav` `w-52` and `AppHeader` `h-12`. */
const SIDE_NAV_WIDTH = "13rem";
const APP_HEADER_HEIGHT = "3rem";

type LinkedFaceCenterPeekProps = {
  asset: AssetPreviewTarget | null;
  panelOpen: boolean;
  onDismiss: () => void;
  browsePeekZoomMultiplier: number;
  onBrowsePeekZoomMultiplierChange: (multiplier: number) => void;
  cataloguePeople?: ImmichPerson[];
};

/**
 * Hover preview over the main canvas only (not the RHS context panel).
 * Portaled so `main` overflow does not clip the overlay.
 */
export function LinkedFaceCenterPeek({
  asset,
  panelOpen,
  onDismiss,
  browsePeekZoomMultiplier,
  onBrowsePeekZoomMultiplierChange,
  cataloguePeople = [],
}: LinkedFaceCenterPeekProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !asset) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[45] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      style={{
        top: APP_HEADER_HEIGHT,
        left: SIDE_NAV_WIDTH,
        right: panelOpen ? "var(--panel-width)" : 0,
        bottom: 0,
      }}
      aria-live="polite"
    >
      <div className="pointer-events-auto flex max-h-full w-full max-w-5xl min-h-[40vh] flex-col">
        <AssetPreviewModal
          embedded
          open
          asset={asset}
          editingLocked
          browsePeekZoomMultiplier={browsePeekZoomMultiplier}
          onBrowsePeekZoomMultiplierChange={onBrowsePeekZoomMultiplierChange}
          cataloguePeople={cataloguePeople}
          onOpenChange={(open) => {
            if (!open) onDismiss();
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
