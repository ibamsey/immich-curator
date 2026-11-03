"use client";

import { useState } from "react";
import { PersonAssetGrid } from "@/components/people/person-asset-grid";
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
  assets,
  loadingAssets,
  sharedAlbumIds,
  onOpenInExplore,
  onPersonUpdated,
  onSwitchContextPerson,
}: Omit<PersonContextPanelProps, "person"> & { person: ImmichPerson }) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">{person.name || "Unnamed"}</p>
        <p className="text-xs text-muted-foreground">
          {loadingAssets
            ? "Loading photos…"
            : `${assets.length} photo${assets.length === 1 ? "" : "s"} in shared albums`}
        </p>
      </div>
      {loadingAssets ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <PersonAssetGrid
          assets={assets}
          sharedAlbumIds={sharedAlbumIds}
          selectedAssetId={selectedAssetId}
          onSelectAsset={setSelectedAssetId}
          onOpenInExplore={onOpenInExplore}
        />
      )}
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
  assets,
  loadingAssets,
  sharedAlbumIds,
  onOpenInExplore,
  onPersonUpdated,
  onSwitchContextPerson,
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
      assets={assets}
      loadingAssets={loadingAssets}
      sharedAlbumIds={sharedAlbumIds}
      onOpenInExplore={onOpenInExplore}
      onPersonUpdated={onPersonUpdated}
      onSwitchContextPerson={onSwitchContextPerson}
    />
  );
}
