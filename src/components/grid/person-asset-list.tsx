"use client";

import { cn } from "@/lib/utils";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import { formatPhysicalSizeSummary } from "@/components/assets/asset-metadata-fields";
import type { GridAsset } from "@/lib/assets/grid-asset";

type PersonAssetListProps = {
  assets: GridAsset[];
  selectedId: string | null;
  onSelect: (assetId: string) => void;
  onOpenInExplore?: (assetId: string) => void;
  scanDefaultDpi?: number;
};

function descriptionSnippet(description: string | undefined, max = 120): string {
  const text = (description ?? "").trim();
  if (!text) return "No description";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function PersonAssetList({
  assets,
  selectedId,
  onSelect,
  onOpenInExplore,
  scanDefaultDpi = 600,
}: PersonAssetListProps) {
  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      role="list"
      aria-label="Photos with this person"
    >
      {assets.map((asset) => {
        const selected = asset.id === selectedId;
        const physicalSummary = formatPhysicalSizeSummary(asset, scanDefaultDpi);
        return (
          <button
            key={asset.id}
            type="button"
            role="listitem"
            onClick={() => onSelect(asset.id)}
            onDoubleClick={(e) => {
              e.preventDefault();
              onOpenInExplore?.(asset.id);
            }}
            className={cn(
              "flex gap-2 rounded-md border border-border bg-card p-2 text-left outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/40",
              selected &&
                "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
            title="Click to show faces · double-click to open in Explore"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetThumbnailPath(asset.id)}
                alt={asset.originalFileName}
                loading="lazy"
                className="size-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 text-xs text-muted-foreground">
              <p className="line-clamp-2">{descriptionSnippet(asset.description)}</p>
              {physicalSummary ? (
                <p className="mt-0.5 line-clamp-1 text-[11px]">{physicalSummary}</p>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
