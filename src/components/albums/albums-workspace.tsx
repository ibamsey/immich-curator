"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { AlbumGrid } from "@/components/albums/album-grid";
import { AlbumsContextPanel } from "@/components/albums/albums-context-panel";
import { AssetGrid } from "@/components/explore/asset-grid";
import {
  AssetCurationPanel,
  type CurationPanelConfig,
} from "@/components/explore/asset-curation-panel";
import type { CuratorShareConfig } from "@/components/albums/album-detail-panel";
import type { ShellContext } from "@/lib/server/shell-context";
import type { ImmichAlbum, ImmichAsset } from "@/lib/immich/types";

type AlbumsWorkspaceProps = {
  shell: ShellContext;
  initialAlbums: ImmichAlbum[];
  shareConfig: CuratorShareConfig;
  curationConfig: CurationPanelConfig;
};

export function AlbumsWorkspace({
  shell,
  initialAlbums,
  shareConfig,
  curationConfig,
}: AlbumsWorkspaceProps) {
  const [albums, setAlbums] = useState(initialAlbums);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ImmichAlbum | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [hideShared, setHideShared] = useState(false);

  const [viewMode, setViewMode] = useState<"crud" | "explore">("crud");
  const [exploreAlbum, setExploreAlbum] = useState<ImmichAlbum | null>(null);
  const [exploreAssets, setExploreAssets] = useState<ImmichAsset[]>([]);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [exploreError, setExploreError] = useState<string | null>(null);

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [assetDetail, setAssetDetail] = useState<ImmichAsset | null>(null);
  const [loadingAssetDetail, setLoadingAssetDetail] = useState(false);

  const exploreMode = viewMode === "explore";

  const filtered = useMemo(() => {
    if (!hideShared || !shareConfig.operatorUserId) return albums;
    return albums.filter(
      (a) =>
        !a.albumUsers?.some(
          (u) => u.user.id === shareConfig.operatorUserId,
        ),
    );
  }, [albums, hideShared, shareConfig.operatorUserId]);

  const loadAlbumDetail = useCallback((albumId: string) => {
    setSelectedId(albumId);
    setPanelOpen(true);
    setLoadingDetail(true);
    setDetail(null);
    fetch(`/api/immich/albums/${albumId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ImmichAlbum | null) => {
        setDetail(data);
        setLoadingDetail(false);
      })
      .catch(() => {
        setDetail(null);
        setLoadingDetail(false);
      });
  }, []);

  const exitExplore = useCallback(() => {
    setViewMode("crud");
    setExploreAlbum(null);
    setExploreAssets([]);
    setExploreError(null);
    setSelectedAssetId(null);
    setAssetDetail(null);
    setPanelOpen(true);
  }, []);

  const openAlbumExplore = useCallback((albumId: string) => {
    setViewMode("explore");
    setLoadingExplore(true);
    setExploreError(null);
    setExploreAlbum(null);
    setExploreAssets([]);
    setSelectedAssetId(null);
    setAssetDetail(null);
    setPanelOpen(false);

    const fallbackName =
      albums.find((a) => a.id === albumId)?.albumName ?? "Album";
    setExploreAlbum({
      id: albumId,
      albumName: fallbackName,
      assetCount: 0,
    } as ImmichAlbum);

    Promise.all([
      fetch(`/api/immich/albums/${albumId}`).then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Album not found")),
      ),
      fetch(`/api/immich/albums/${albumId}/assets`).then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Assets not found")),
      ),
    ])
      .then(([album, assetsPayload]: [ImmichAlbum, { assets: ImmichAsset[] }]) => {
        setExploreAlbum(album);
        setExploreAssets(assetsPayload.assets ?? []);
        setLoadingExplore(false);
      })
      .catch((e: Error) => {
        setExploreAssets([]);
        setExploreError(e.message ?? "Failed to load album");
        setLoadingExplore(false);
      });
  }, [albums]);

  useEffect(() => {
    if (!exploreMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        exitExplore();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [exploreMode, exitExplore]);

  const onAlbumUpdated = useCallback((updated: ImmichAlbum) => {
    setDetail(updated);
    setAlbums((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
    );
  }, []);

  const onAssetUpdated = useCallback((updated: ImmichAsset) => {
    setAssetDetail(updated);
    setExploreAssets((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
    );
  }, []);

  const onAssetDeleted = useCallback((assetId: string) => {
    setExploreAssets((prev) => prev.filter((a) => a.id !== assetId));
    setSelectedAssetId(null);
    setAssetDetail(null);
    setPanelOpen(false);
  }, []);

  const onSelectAsset = useCallback((assetId: string) => {
    setSelectedAssetId(assetId);
    setPanelOpen(true);
    setLoadingAssetDetail(true);
    setAssetDetail(null);
    fetch(`/api/immich/assets/${assetId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ImmichAsset | null) => {
        setAssetDetail(data);
        setLoadingAssetDetail(false);
      })
      .catch(() => {
        setAssetDetail(null);
        setLoadingAssetDetail(false);
      });
  }, []);

  const crudPanelContent = (
    <AlbumsContextPanel
      albums={filtered}
      selectedId={selectedId}
      operatorUserId={shareConfig.operatorUserId}
      onSelectAlbum={loadAlbumDetail}
      onOpenAlbumExplore={openAlbumExplore}
      detail={detail}
      loadingDetail={loadingDetail}
      shareConfig={shareConfig}
      onAlbumUpdated={onAlbumUpdated}
    />
  );

  const explorePanelContent = selectedAssetId ? (
    <AssetCurationPanel
      assetId={selectedAssetId}
      albumId={exploreAlbum?.id ?? null}
      asset={assetDetail}
      loading={loadingAssetDetail}
      operatorUserId={curationConfig.operatorUserId}
      operatorCommentsEnabled={curationConfig.operatorCommentsEnabled}
      onAssetUpdated={onAssetUpdated}
      onAssetDeleted={onAssetDeleted}
    />
  ) : null;

  return (
    <AppShell
      targetEmail={shell.targetEmail}
      connectionOk={shell.connectionOk}
      headerTitle={
        exploreMode
          ? (exploreAlbum?.albumName ?? "Album")
          : "Albums"
      }
      headerSubtitle={
        exploreMode
          ? `${exploreAssets.length} photos`
          : `${albums.length} on target account`
      }
      panelTitle={exploreMode ? "Photo details" : "Albums"}
      panelOpen={panelOpen}
      onPanelOpenChange={setPanelOpen}
      panelContent={exploreMode ? explorePanelContent : crudPanelContent}
      onHeaderBack={exploreMode ? exitExplore : undefined}
      headerBackLabel="Back to albums"
    >
      {exploreMode ? (
        exploreError ? (
          <p className="p-8 text-center text-sm text-destructive">
            {exploreError}
          </p>
        ) : loadingExplore ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Loading photos…
          </p>
        ) : (
          <AssetGrid
            assets={exploreAssets}
            selectedId={selectedAssetId}
            onSelect={onSelectAsset}
          />
        )
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-border px-3 py-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={hideShared}
                onChange={(e) => setHideShared(e.target.checked)}
                className="rounded border-input"
              />
              Not shared with operator
            </label>
          </div>
          <AlbumGrid
            albums={filtered}
            selectedId={selectedId}
            operatorUserId={shareConfig.operatorUserId}
            onSelect={loadAlbumDetail}
            onOpenExplore={openAlbumExplore}
          />
        </>
      )}
    </AppShell>
  );
}
