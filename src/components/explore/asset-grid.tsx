"use client";

import { cn } from "@/lib/utils";
import { assetThumbnailPath } from "@/lib/immich/assets";
import type { ImmichAsset } from "@/lib/immich/types";

type AssetGridProps = {
  assets: ImmichAsset[];
  selectedId: string | null;
  onSelect: (assetId: string) => void;
};

export function AssetGrid({ assets, selectedId, onSelect }: AssetGridProps) {
  if (assets.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        No images in this album.
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-[var(--photo-grid-gap)] p-3"
      role="list"
    >
      {assets.map((asset) => {
        const selected = asset.id === selectedId;
        return (
          <button
            key={asset.id}
            type="button"
            role="listitem"
            onClick={() => onSelect(asset.id)}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-sm bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetThumbnailPath(asset.id)}
              alt={asset.originalFileName}
              loading="lazy"
              className="size-full object-cover transition-transform group-hover:scale-[1.02]"
            />
          </button>
        );
      })}
    </div>
  );
}
