"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { AssetGrid } from "@/components/explore/asset-grid";
import {
  AssetCurationPanel,
  type CurationPanelConfig,
} from "@/components/explore/asset-curation-panel";
import type { ShellContext } from "@/lib/server/shell-context";
import type { ImmichAlbum, ImmichAsset } from "@/lib/immich/types";

export type { CurationPanelConfig };

type ExploreWorkspaceProps = {
  shell: ShellContext;
  album: ImmichAlbum;
  assets: ImmichAsset[];
  initialSelectedAssetId?: string | null;
  curationConfig: CurationPanelConfig;
};

export function ExploreWorkspace({
  shell,
  album,
  assets: initialAssets,
  initialSelectedAssetId = null,
  curationConfig,
}: ExploreWorkspaceProps) {
  const [assets, setAssets] = useState(initialAssets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ImmichAsset | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const onSelect = useCallback((assetId: string) => {
    setSelectedId(assetId);
    setPanelOpen(true);
    setLoadingDetail(true);
    setDetail(null);
    fetch(`/api/immich/assets/${assetId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ImmichAsset | null) => {
        setDetail(data);
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

  const onAssetUpdated = useCallback((updated: ImmichAsset) => {
    setDetail(updated);
    setAssets((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
    );
  }, []);

  const onAssetDeleted = useCallback((assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    setSelectedId(null);
    setDetail(null);
    setPanelOpen(false);
  }, []);

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
    />
  ) : null;

  return (
    <AppShell
      targetEmail={shell.targetEmail}
      connectionOk={shell.connectionOk}
      headerTitle={album.albumName}
      headerSubtitle={`${assets.length} photos`}
      panelTitle="Photo details"
      panelOpen={panelOpen}
      onPanelOpenChange={setPanelOpen}
      panelContent={panelContent}
    >
      <AssetGrid
        assets={assets}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </AppShell>
  );
}
