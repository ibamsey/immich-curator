"use client";

import { cn } from "@/lib/utils";
import { assetThumbnailPath } from "@/lib/immich/assets";
import {
  AlbumSharedIndicator,
  albumSharedWithOperator,
} from "@/components/albums/album-shared-indicator";
import type { ImmichAlbum } from "@/lib/immich/types";

type AlbumGridProps = {
  albums: ImmichAlbum[];
  selectedId: string | null;
  operatorUserId: string | null;
  onSelect: (albumId: string) => void;
  onOpenExplore?: (albumId: string) => void;
};

export function AlbumGrid({
  albums,
  selectedId,
  operatorUserId,
  onSelect,
  onOpenExplore,
}: AlbumGridProps) {
  if (albums.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        No albums on target account.
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 p-3"
      role="list"
    >
      {albums.map((album) => {
        const selected = album.id === selectedId;
        const sharedWithOperator = albumSharedWithOperator(
          album,
          operatorUserId,
        );
        const thumbId = album.albumThumbnailAssetId;
        return (
          <button
            key={album.id}
            type="button"
            role="listitem"
            onClick={() => onSelect(album.id)}
            onDoubleClick={() => onOpenExplore?.(album.id)}
            className={cn(
              "flex flex-col overflow-hidden rounded-md border border-border bg-card text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
          >
            <div className="relative aspect-[4/3] bg-muted">
              {thumbId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assetThumbnailPath(thumbId)}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                  No cover
                </div>
              )}
              {sharedWithOperator ? (
                <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-primary/90 px-1.5 py-0.5 text-primary-foreground">
                  <AlbumSharedIndicator className="size-3 text-primary-foreground" />
                </span>
              ) : null}
            </div>
            <div className="space-y-0.5 p-2">
              <p className="truncate text-sm font-medium">{album.albumName}</p>
              <p className="text-xs text-muted-foreground">
                {album.assetCount} photos
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
