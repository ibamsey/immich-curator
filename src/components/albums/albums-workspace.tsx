"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { AlbumGrid } from "@/components/albums/album-grid";
import { AlbumsContextPanel } from "@/components/albums/albums-context-panel";
import {
  QueryableAssetGridSection,
  type QueryableAssetGridSectionHandle,
} from "@/components/grid/queryable-asset-grid-section";
import {
  AssetCurationPanel,
  type CurationPanelConfig,
} from "@/components/explore/asset-curation-panel";
import type { CuratorShareConfig } from "@/components/albums/album-detail-panel";
import type { ShellContext } from "@/lib/server/shell-context";
import { useScanDefaultDpi } from "@/components/grid/use-scan-default-dpi";
import { normalizeAssetDetail } from "@/lib/assets/grid-asset";
import type { ImmichAlbum, ImmichAssetWithEnrichment } from "@/lib/immich/types";
import {
  AssetPreviewModal,
  type AssetPreviewTarget,
} from "@/components/grid/asset-preview-modal";

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
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [exploreError, setExploreError] = useState<string | null>(null);
  const [explorePhotoTotal, setExplorePhotoTotal] = useState<number | null>(
    null,
  );

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const scanDefaultDpi = useScanDefaultDpi();
  const [assetDetail, setAssetDetail] = useState<ImmichAssetWithEnrichment | null>(
    null,
  );
  const [loadingAssetDetail, setLoadingAssetDetail] = useState(false);
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const [fullPreviewAsset, setFullPreviewAsset] =
    useState<AssetPreviewTarget | null>(null);
  const exploreGridRef = useRef<QueryableAssetGridSectionHandle>(null);

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
    setExploreError(null);
    setExplorePhotoTotal(null);
    setSelectedAssetId(null);
    setAssetDetail(null);
    setFullPreviewOpen(false);
    setFullPreviewAsset(null);
    setPanelOpen(true);
  }, []);

  const openAlbumExplore = useCallback((albumId: string) => {
    setViewMode("explore");
    setLoadingExplore(true);
    setExploreError(null);
    setExplorePhotoTotal(null);
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

    fetch(`/api/immich/albums/${albumId}`)
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Album not found")),
      )
      .then((album: ImmichAlbum) => {
        setExploreAlbum(album);
        setLoadingExplore(false);
      })
      .catch((e: Error) => {
        setExploreAlbum(null);
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

  const onAssetUpdated = useCallback((updated: ImmichAssetWithEnrichment) => {
    setAssetDetail(updated);
  }, []);

  const onAssetDeleted = useCallback((assetId: string) => {
    exploreGridRef.current?.removeAsset(assetId);
    exploreGridRef.current?.refetch();
    setSelectedAssetId(null);
    setAssetDetail(null);
    setFullPreviewOpen(false);
    setFullPreviewAsset(null);
    setPanelOpen(false);
  }, []);

  const onSelectAsset = useCallback((assetId: string) => {
    setSelectedAssetId(assetId);
    setPanelOpen(true);
    setLoadingAssetDetail(true);
    setAssetDetail(null);
    fetch(`/api/immich/assets/${assetId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ImmichAssetWithEnrichment | null) => {
        setAssetDetail(
          data ? normalizeAssetDetail(data as unknown as Record<string, unknown>) : null,
        );
        setLoadingAssetDetail(false);
      })
      .catch(() => {
        setAssetDetail(null);
        setLoadingAssetDetail(false);
      });
  }, []);

  const openFullPreview = useCallback(() => {
    if (!assetDetail) return;
    setFullPreviewAsset({
      id: assetDetail.id,
      originalFileName: assetDetail.originalFileName,
    });
    setFullPreviewOpen(true);
  }, [assetDetail]);

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
      defaultScanDpi={scanDefaultDpi}
      onOpenFullPreview={openFullPreview}
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
          ? explorePhotoTotal != null
            ? `${explorePhotoTotal} photos`
            : "Photos"
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
        ) : loadingExplore || !exploreAlbum ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Loading photos…
          </p>
        ) : (
          <QueryableAssetGridSection
            ref={exploreGridRef}
            scope={{ mode: "album", albumId: exploreAlbum.id }}
            storageKey={`albums:${exploreAlbum.id}`}
            selectedId={selectedAssetId}
            onSelect={onSelectAsset}
            onSelectionLost={() => {
              setSelectedAssetId(null);
              setAssetDetail(null);
              setFullPreviewOpen(false);
              setFullPreviewAsset(null);
              setPanelOpen(false);
            }}
            layout="thumb"
            onTotalChange={setExplorePhotoTotal}
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
      {exploreMode ? (
        <AssetPreviewModal
          key={fullPreviewAsset?.id ?? "closed"}
          open={fullPreviewOpen}
          onOpenChange={(open) => {
            setFullPreviewOpen(open);
            if (!open) setFullPreviewAsset(null);
          }}
          asset={fullPreviewAsset}
        />
      ) : null}
    </AppShell>
  );
}
