"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { PersonCatalogGrid } from "@/components/people/person-catalog-grid";
import { PersonContextPanel } from "@/components/people/person-context-panel";
import type { ShellContext } from "@/lib/server/shell-context";
import type { ImmichAsset, ImmichPerson } from "@/lib/immich/types";

type PeopleWorkspaceProps = {
  shell: ShellContext;
  initialPeople: ImmichPerson[];
  initialSharedAlbumIds: string[];
  loadError: string | null;
};

export function PeopleWorkspace({
  shell,
  initialPeople,
  initialSharedAlbumIds,
  loadError,
}: PeopleWorkspaceProps) {
  const router = useRouter();
  const [people, setPeople] = useState(initialPeople);
  const [sharedAlbumIds, setSharedAlbumIds] = useState(initialSharedAlbumIds);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [assets, setAssets] = useState<ImmichAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const selectedPerson =
    people.find((p) => p.id === selectedId) ?? null;

  const loadPersonAssets = useCallback((personId: string) => {
    setLoadingAssets(true);
    setAssets([]);
    fetch(`/api/immich/people/${personId}/assets`)
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            assets: ImmichAsset[];
            sharedAlbumIds: string[];
          } | null,
        ) => {
          if (data) {
            setAssets(data.assets);
            setSharedAlbumIds(data.sharedAlbumIds);
          }
          setLoadingAssets(false);
        },
      )
      .catch(() => {
        setAssets([]);
        setLoadingAssets(false);
      });
  }, []);

  const onSelect = useCallback(
    (personId: string) => {
      setSelectedId(personId);
      setPanelOpen(true);
      loadPersonAssets(personId);
    },
    [loadPersonAssets],
  );

  const onPersonUpdated = useCallback((updated: ImmichPerson) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    );
  }, []);

  const onSwitchContextPerson = useCallback(
    (personId: string) => {
      setSelectedId(personId);
      setPanelOpen(true);
      loadPersonAssets(personId);
    },
    [loadPersonAssets],
  );

  const onOpenInExplore = useCallback(
    (assetId: string, albumId: string | null) => {
      const params = new URLSearchParams({ assetId });
      if (albumId) params.set("albumId", albumId);
      router.push(`/explore?${params.toString()}`);
    },
    [router],
  );

  const panelContent = (
    <PersonContextPanel
      person={selectedPerson}
      assets={assets}
      loadingAssets={loadingAssets}
      sharedAlbumIds={sharedAlbumIds}
      onOpenInExplore={onOpenInExplore}
      onPersonUpdated={onPersonUpdated}
      onSwitchContextPerson={onSwitchContextPerson}
    />
  );

  return (
    <AppShell
      targetEmail={shell.targetEmail}
      connectionOk={shell.connectionOk}
      headerTitle="People"
      headerSubtitle={
        loadError
          ? loadError
          : `${people.length} in shared albums`
      }
      panelTitle="Photos"
      panelOpen={panelOpen}
      onPanelOpenChange={setPanelOpen}
      panelContent={panelContent}
    >
      {loadError ? (
        <p className="p-8 text-center text-sm text-destructive">{loadError}</p>
      ) : (
        <PersonCatalogGrid
          people={people}
          selectedId={selectedId}
          onSelect={onSelect}
          onPersonUpdated={onPersonUpdated}
        />
      )}
    </AppShell>
  );
}
