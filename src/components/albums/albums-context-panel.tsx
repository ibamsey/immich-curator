"use client";

import { cn } from "@/lib/utils";
import {
  AlbumSharedIndicator,
  albumSharedWithOperator,
} from "@/components/albums/album-shared-indicator";
import {
  AlbumDetailPanel,
  type CuratorShareConfig,
} from "@/components/albums/album-detail-panel";
import type { ImmichAlbum } from "@/lib/immich/types";

type AlbumsContextPanelProps = {
  albums: ImmichAlbum[];
  selectedId: string | null;
  operatorUserId: string | null;
  onSelectAlbum: (albumId: string) => void;
  onOpenAlbumExplore: (albumId: string) => void;
  detail: ImmichAlbum | null;
  loadingDetail: boolean;
  shareConfig: CuratorShareConfig;
  onAlbumUpdated: (album: ImmichAlbum) => void;
};

export function AlbumsContextPanel({
  albums,
  selectedId,
  operatorUserId,
  onSelectAlbum,
  onOpenAlbumExplore,
  detail,
  loadingDetail,
  shareConfig,
  onAlbumUpdated,
}: AlbumsContextPanelProps) {
  return (
    <div className="flex min-h-0 flex-col gap-0 -m-4">
      <div className="border-b border-border px-3 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Albums
        </p>
      </div>
      <nav
        className="max-h-48 shrink-0 overflow-y-auto border-b border-border py-1"
        aria-label="Album list"
      >
        {albums.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            No albums to show.
          </p>
        ) : (
          <ul className="flex flex-col">
            {albums.map((album) => {
              const active = album.id === selectedId;
              const shared = albumSharedWithOperator(album, operatorUserId);
              return (
                <li key={album.id}>
                  <button
                    type="button"
                    onClick={() => onSelectAlbum(album.id)}
                    onDoubleClick={() => onOpenAlbumExplore(album.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground/90 hover:bg-accent/50",
                    )}
                    title="Double-click to explore photos in this album"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {album.albumName}
                    </span>
                    {shared ? <AlbumSharedIndicator /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <AlbumDetailPanel
          key={selectedId ?? "none"}
          album={selectedId ? detail : null}
          loading={Boolean(selectedId && loadingDetail)}
          shareConfig={shareConfig}
          onAlbumUpdated={onAlbumUpdated}
        />
      </div>
    </div>
  );
}
