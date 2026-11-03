"use client";

import { cn } from "@/lib/utils";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import type { ImmichAsset } from "@/lib/immich/types";

type PersonAssetGridProps = {
  assets: ImmichAsset[];
  sharedAlbumIds: string[];
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
  onOpenInExplore: (assetId: string, albumId: string | null) => void;
};

function descriptionSnippet(description: string | undefined, max = 120): string {
  const text = (description ?? "").trim();
  if (!text) return "No description";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function PersonAssetGrid({
  assets,
  sharedAlbumIds,
  selectedAssetId,
  onSelectAsset,
  onOpenInExplore,
}: PersonAssetGridProps) {
  const defaultAlbumId = sharedAlbumIds[0] ?? null;

  if (assets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No photos for this person in shared albums.
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      role="list"
      aria-label="Photos with this person"
    >
      {assets.map((asset) => {
        const selected = asset.id === selectedAssetId;
        return (
          <button
            key={asset.id}
            type="button"
            role="listitem"
            onClick={() => onSelectAsset(asset.id)}
            onDoubleClick={(e) => {
              e.preventDefault();
              onOpenInExplore(asset.id, defaultAlbumId);
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
            <p className="line-clamp-3 min-w-0 flex-1 text-xs text-muted-foreground">
              {descriptionSnippet(asset.description)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
