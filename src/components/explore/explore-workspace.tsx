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
import type { ShellContext } from "@/lib/server/shell-context";
import { useScanDefaultDpi } from "@/components/grid/use-scan-default-dpi";
import { normalizeAssetDetail } from "@/lib/assets/grid-asset";
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
  }, []);

  const openFullPreview = useCallback(() => {
    if (!detail) return;
    setFullPreviewAsset({
      id: detail.id,
      originalFileName: detail.originalFileName,
    });
    setFullPreviewOpen(true);
  }, [detail]);

  const panelContent = selectedId ? (
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
  ) : null;

  return (
    <AppShell
      targetEmail={shell.targetEmail}
      connectionOk={shell.connectionOk}
      headerTitle={album.albumName}
      headerSubtitle={
        photoTotal != null ? `${photoTotal} photos` : "Photos"
      }
      panelTitle="Photo details"
      panelOpen={panelOpen}
      onPanelOpenChange={setPanelOpen}
      panelContent={panelContent}
    >
      <QueryableAssetGridSection
        ref={gridRef}
        scope={{ mode: "album", albumId: album.id }}
        storageKey={`explore:${album.id}`}
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
      />
      <AssetPreviewModal
        key={fullPreviewAsset?.id ?? "closed"}
        open={fullPreviewOpen}
        onOpenChange={(open) => {
          setFullPreviewOpen(open);
          if (!open) setFullPreviewAsset(null);
        }}
        asset={fullPreviewAsset}
      />
    </AppShell>
  );
}
