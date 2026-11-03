"use client";

import { useState } from "react";
import { QueryableAssetGridSection } from "@/components/grid/queryable-asset-grid-section";
import { AssetFacesSection } from "@/components/people/asset-faces-section";
import type { ImmichAsset, ImmichPerson } from "@/lib/immich/types";

type PersonContextPanelProps = {
  person: ImmichPerson | null;
  assets: ImmichAsset[];
  loadingAssets: boolean;
  sharedAlbumIds: string[];
  onOpenInExplore: (assetId: string, albumId: string | null) => void;
  onPersonUpdated: (person: ImmichPerson) => void;
  onSwitchContextPerson: (personId: string) => void;
};

function PersonContextPanelBody({
  person,
  sharedAlbumIds,
  onOpenInExplore,
  onPersonUpdated,
  onSwitchContextPerson,
}: Omit<PersonContextPanelProps, "person" | "assets" | "loadingAssets"> & {
  person: ImmichPerson;
}) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [photoTotal, setPhotoTotal] = useState<number | null>(null);
  const defaultAlbumId = sharedAlbumIds[0] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">{person.name || "Unnamed"}</p>
        <p className="text-xs text-muted-foreground">
          {photoTotal != null
            ? `${photoTotal} photo${photoTotal === 1 ? "" : "s"} in shared albums`
            : "Photos in shared albums"}
        </p>
      </div>
      <QueryableAssetGridSection
        scope={{ mode: "personShared", personId: person.id }}
        storageKey={null}
        selectedId={selectedAssetId}
        onSelect={setSelectedAssetId}
        layout="detailed"
        showToolbar={false}
        persistQuery={false}
        onTotalChange={setPhotoTotal}
        onOpenInExplore={(assetId) =>
          onOpenInExplore(assetId, defaultAlbumId)
        }
      />
      <AssetFacesSection
        assetId={selectedAssetId}
        contextPerson={person}
        onPersonUpdated={onPersonUpdated}
        onSwitchContextPerson={(id) => {
          setSelectedAssetId(null);
          onSwitchContextPerson(id);
        }}
      />
    </div>
  );
}

export function PersonContextPanel({
  person,
  onOpenInExplore,
  onPersonUpdated,
  onSwitchContextPerson,
  sharedAlbumIds,
}: PersonContextPanelProps) {
  if (!person) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a person to see photos from shared albums.
      </p>
    );
  }

  return (
    <PersonContextPanelBody
      key={person.id}
      person={person}
      sharedAlbumIds={sharedAlbumIds}
      onOpenInExplore={onOpenInExplore}
      onPersonUpdated={onPersonUpdated}
      onSwitchContextPerson={onSwitchContextPerson}
    />
  );
}
