"use client";

import { useCallback, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { AssetGrid } from "@/components/explore/asset-grid";
import { AssetDetailPanel } from "@/components/explore/asset-detail-panel";
import type { ShellContext } from "@/lib/server/shell-context";
import type { ImmichAlbum, ImmichAsset } from "@/lib/immich/types";

type ExploreWorkspaceProps = {
  shell: ShellContext;
  album: ImmichAlbum;
  assets: ImmichAsset[];
};

export function ExploreWorkspace({
  shell,
  album,
  assets,
}: ExploreWorkspaceProps) {
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

  const panelContent = selectedId ? (
    <AssetDetailPanel
      assetId={selectedId}
      asset={detail}
      loading={loadingDetail}
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
