"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import {
  QueryableAssetGridSection,
  type QueryableAssetGridSectionHandle,
} from "@/components/grid/queryable-asset-grid-section";
import {
  AssetCurationPanel,
  type CurationPanelConfig,
} from "@/components/explore/asset-curation-panel";
import { ExploreSelectionHeader } from "@/components/explore/explore-selection-header";
import { MultiAssetActionsPanel } from "@/components/explore/multi-asset-actions-panel";
import type { ShellContext } from "@/lib/server/shell-context";
import { useAssetSelection } from "@/lib/assets/use-asset-selection";
import { useScanDefaultDpi } from "@/components/grid/use-scan-default-dpi";
import { normalizeAssetDetail, type GridAsset } from "@/lib/assets/grid-asset";
import { EXPLORE_GRID_QUERY } from "@/lib/assets/grid-query-types";
import type { ImmichAlbum, ImmichAssetWithEnrichment } from "@/lib/immich/types";
import {
  AssetPreviewModal,
  type AssetPreviewTarget,
} from "@/components/grid/asset-preview-modal";

export type { CurationPanelConfig };

type ExploreWorkspaceProps = {
  shell: ShellContext;
  album: ImmichAlbum;
  assets: ImmichAssetWithEnrichment[];
  initialSelectedAssetId?: string | null;
  curationConfig: CurationPanelConfig;
};

export function ExploreWorkspace({
  shell,
  album,
  initialSelectedAssetId = null,
  curationConfig,
}: ExploreWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scanDefaultDpi = useScanDefaultDpi();
  const [detail, setDetail] = useState<ImmichAssetWithEnrichment | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [photoTotal, setPhotoTotal] = useState<number | null>(null);
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const [fullPreviewAsset, setFullPreviewAsset] =
    useState<AssetPreviewTarget | null>(null);
  const gridRef = useRef<QueryableAssetGridSectionHandle>(null);
  const [gridAssets, setGridAssets] = useState<GridAsset[]>([]);

  const {
    selectedIds,
    size: multiSelectSize,
    idList: multiSelectIds,
    toggle: toggleMultiSelect,
    toggleMany: toggleGroupSelect,
    clear: clearMultiSelect,
    prune,
    selectionMode,
  } = useAssetSelection();

  const multiSelectActive = multiSelectSize >= 2;

  const onSelect = useCallback((assetId: string) => {
    setSelectedId(assetId);
    setPanelOpen(true);
    setLoadingDetail(true);
    setDetail(null);
    fetch(`/api/immich/assets/${assetId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ImmichAssetWithEnrichment | null) => {
        setDetail(
          data ? normalizeAssetDetail(data as unknown as Record<string, unknown>) : null,
        );
        setLoadingDetail(false);
      })
      .catch(() => {
        setDetail(null);
        setLoadingDetail(false);
      });
  }, []);

  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (!initialSelectedAssetId || deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    onSelect(initialSelectedAssetId);
  }, [initialSelectedAssetId, onSelect]);

  const onToggleMultiSelect = useCallback(
    (id: string) => {
      toggleMultiSelect(id);
      setPanelOpen(true);
    },
    [toggleMultiSelect],
  );

  const onToggleGroupSelect = useCallback(
    (ids: string[]) => {
      toggleGroupSelect(ids);
      setPanelOpen(true);
    },
    [toggleGroupSelect],
  );

  const onAssetUpdated = useCallback((updated: ImmichAssetWithEnrichment) => {
    setDetail(updated);
  }, []);

  const onAssetDeleted = useCallback((assetId: string) => {
    gridRef.current?.removeAsset(assetId);
    gridRef.current?.refetch();
    setSelectedId(null);
    setDetail(null);
    setPanelOpen(false);
    setFullPreviewOpen(false);
    setFullPreviewAsset(null);
    clearMultiSelect();
  }, [clearMultiSelect]);

  const openFullPreview = useCallback(() => {
    if (!detail) return;
    setFullPreviewAsset({
      id: detail.id,
      originalFileName: detail.originalFileName,
      type: detail.type,
    });
    setFullPreviewOpen(true);
  }, [detail]);

  const onAssetReplaced = useCallback(
    (oldId: string, next: ImmichAssetWithEnrichment) => {
      setSelectedId(next.id);
      setDetail(next);
      setFullPreviewAsset({
        id: next.id,
        originalFileName: next.originalFileName,
        type: next.type,
      });
      gridRef.current?.removeAsset(oldId);
      gridRef.current?.refetch();
    },
    [],
  );

  const handlePruneSelection = useCallback(
    (ids: string[]) => {
      prune(ids);
    },
    [prune],
  );

  const handleBulkRefresh = useCallback(() => {
    gridRef.current?.refetch();
    if (selectedId) {
      fetch(`/api/immich/assets/${selectedId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: ImmichAssetWithEnrichment | null) => {
          if (data) {
            setDetail(
              normalizeAssetDetail(data as unknown as Record<string, unknown>),
            );
          }
        })
        .catch(() => {});
    }
  }, [selectedId]);

  const panelContent = multiSelectActive ? (
    <MultiAssetActionsPanel
      assetIds={multiSelectIds}
      assets={gridAssets}
      onClear={clearMultiSelect}
      onRefresh={handleBulkRefresh}
    />
  ) : selectedId ? (
    <div className="p-4">
      {multiSelectSize === 1 ? (
        <ExploreSelectionHeader
          count={1}
          onClear={clearMultiSelect}
        />
      ) : null}
      <AssetCurationPanel
        assetId={selectedId}
        albumId={album.id}
        asset={detail}
        loading={loadingDetail}
        operatorUserId={curationConfig.operatorUserId}
        operatorCommentsEnabled={curationConfig.operatorCommentsEnabled}
        onAssetUpdated={onAssetUpdated}
        onAssetDeleted={onAssetDeleted}
        defaultScanDpi={scanDefaultDpi}
        onOpenFullPreview={openFullPreview}
      />
    </div>
  ) : multiSelectSize === 1 ? (
    <div className="p-4">
      <ExploreSelectionHeader count={1} onClear={clearMultiSelect} />
      <p className="text-sm text-muted-foreground">
        Click a photo to open its details, or tick another to run bulk actions.
      </p>
    </div>
  ) : null;

  return (
    <AppShell
      targetEmail={shell.targetEmail}
      connectionOk={shell.connectionOk}
      headerTitle={album.albumName}
      headerSubtitle={
        photoTotal != null ? `${photoTotal} photos` : "Photos"
      }
      panelTitle={multiSelectActive ? "Bulk actions" : "Photo details"}
      panelOpen={panelOpen}
      onPanelOpenChange={setPanelOpen}
      panelContent={panelContent}
    >
      <QueryableAssetGridSection
        ref={gridRef}
        scope={{ mode: "album", albumId: album.id }}
        storageKey={`explore:${album.id}:by-capture-date`}
        defaultQuery={EXPLORE_GRID_QUERY}
        selectedId={selectedId}
        onSelect={onSelect}
        onSelectionLost={() => {
          setSelectedId(null);
          setDetail(null);
          setPanelOpen(false);
          setFullPreviewOpen(false);
          setFullPreviewAsset(null);
        }}
        layout="thumb"
        onTotalChange={setPhotoTotal}
        multiSelectedIds={selectedIds}
        selectionMode={selectionMode}
        onToggleMultiSelect={onToggleMultiSelect}
        onToggleGroupSelect={onToggleGroupSelect}
        onVisibleAssetIdsChange={handlePruneSelection}
        onGridAssetsChange={setGridAssets}
      />
      <AssetPreviewModal
        key={fullPreviewAsset?.id ?? "closed"}
        open={fullPreviewOpen}
        onOpenChange={(open) => {
          setFullPreviewOpen(open);
          if (!open) setFullPreviewAsset(null);
        }}
        asset={fullPreviewAsset}
        onAssetReplaced={onAssetReplaced}
        onAssetUpdated={(updated) => {
          if (detail?.id === updated.id) {
            onAssetUpdated(updated);
          }
        }}
      />
    </AppShell>
  );
}
