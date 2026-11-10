"use client";

import { useState } from "react";
import { QueryableAssetGridSection } from "@/components/grid/queryable-asset-grid-section";
import { AssetFacesSection } from "@/components/people/asset-faces-section";
import { PersonLinkedFacesSection } from "@/components/people/person-linked-faces-section";
import type { ImmichPerson } from "@/lib/immich/types";
import type { UnassignedFace } from "@/lib/people/unassigned-face";
import type { PersonRhsPanelView } from "@/lib/people/person-rhs-panel";
import type { LinkedFacePeek } from "@/lib/people/linked-face-peek";
import { cn } from "@/lib/utils";

type PersonContextPanelProps = {
  person: ImmichPerson | null;
  sharedAlbumIds: string[];
  /** Persisted in workspace (+ sessionStorage): Photos vs Linked faces */
  panelView: PersonRhsPanelView;
  onPanelViewChange: (view: PersonRhsPanelView) => void;
  onOpenInExplore: (assetId: string, albumId: string | null) => void;
  onPersonUpdated: (person: ImmichPerson) => void;
  onPersonMerged?: (removedPersonId: string, survivor: ImmichPerson) => void;
  onSwitchContextPerson: (personId: string) => void;
  onFaceUnlinkedFromPerson?: (face: UnassignedFace) => void;
  onFaceLinkedFromPerson?: (face: UnassignedFace) => void;
  cataloguePeople?: ImmichPerson[];
  linkedFacePeekId?: string | null;
  onLinkedFaceHover?: (target: LinkedFacePeek | null) => void;
  onLinkedFaceClickEdit?: (
    assetId: string,
    faceId: string,
    face: UnassignedFace,
  ) => void;
};

function PersonContextPanelBody({
  person,
  sharedAlbumIds,
  panelView,
  onPanelViewChange,
  onOpenInExplore,
  onPersonUpdated,
  onPersonMerged,
  onSwitchContextPerson,
  onFaceUnlinkedFromPerson,
  onFaceLinkedFromPerson,
  cataloguePeople = [],
  linkedFacePeekId = null,
  onLinkedFaceHover,
  onLinkedFaceClickEdit,
}: Omit<PersonContextPanelProps, "person"> & {
  person: ImmichPerson;
}) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [photoTotal, setPhotoTotal] = useState<number | null>(null);
  const defaultAlbumId = sharedAlbumIds[0] ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-0">
      <div className="-mx-4 shrink-0 space-y-2 border-b border-border/60 bg-card px-4 pb-3">
        <div>
          <p className="text-sm font-medium">{person.name || "Unnamed"}</p>
          <p className="text-xs text-muted-foreground">
            {panelView === "faces"
              ? "Faces linked to this person in Immich (shared scope)"
              : photoTotal != null
                ? `${photoTotal} photo${photoTotal === 1 ? "" : "s"} in shared albums`
                : "Photos in shared albums"}
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Person context"
          className="flex gap-1 rounded-full border border-border bg-muted/40 p-0.5"
        >
          {(
            [
              ["photos", "Photos"],
              ["faces", "Linked faces"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={panelView === id}
              onClick={() => onPanelViewChange(id)}
              className={cn(
                "flex-1 rounded-full px-2 py-1 text-center text-[11px] transition-colors",
                panelView === id
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pt-3">
        {panelView === "photos" ? (
          <>
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
              cataloguePeople={cataloguePeople}
              onPersonUpdated={onPersonUpdated}
              onPersonMerged={onPersonMerged}
              onSwitchContextPerson={(id) => {
                setSelectedAssetId(null);
                onSwitchContextPerson(id);
              }}
            />
          </>
        ) : (
          <PersonLinkedFacesSection
            person={person}
            onPersonUpdated={onPersonUpdated}
            onFaceUnlinked={onFaceUnlinkedFromPerson}
            onFaceLinked={onFaceLinkedFromPerson}
            activePeekFaceId={linkedFacePeekId}
            onFaceHover={onLinkedFaceHover}
            onFaceClickEdit={onLinkedFaceClickEdit}
          />
        )}
      </div>
    </div>
  );
}

export function PersonContextPanel({
  person,
  panelView,
  onPanelViewChange,
  onOpenInExplore,
  onPersonUpdated,
  onPersonMerged,
  onSwitchContextPerson,
  onFaceUnlinkedFromPerson,
  onFaceLinkedFromPerson,
  sharedAlbumIds,
  cataloguePeople,
  linkedFacePeekId,
  onLinkedFaceHover,
  onLinkedFaceClickEdit,
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
      panelView={panelView}
      onPanelViewChange={onPanelViewChange}
      onOpenInExplore={onOpenInExplore}
      onPersonUpdated={onPersonUpdated}
      onPersonMerged={onPersonMerged}
      onSwitchContextPerson={onSwitchContextPerson}
      onFaceUnlinkedFromPerson={onFaceUnlinkedFromPerson}
      onFaceLinkedFromPerson={onFaceLinkedFromPerson}
      cataloguePeople={cataloguePeople}
      linkedFacePeekId={linkedFacePeekId}
      onLinkedFaceHover={onLinkedFaceHover}
      onLinkedFaceClickEdit={onLinkedFaceClickEdit}
    />
  );
}
