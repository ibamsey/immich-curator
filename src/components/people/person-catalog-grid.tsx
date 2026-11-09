"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { personThumbnailPath } from "@/lib/immich/person-thumbnail-path";
import { PersonIdentityEditor } from "@/components/people/person-identity-editor";
import type { ImmichPerson } from "@/lib/immich/types";

type PersonCatalogGridProps = {
  people: ImmichPerson[];
  cataloguePeople?: ImmichPerson[];
  selectedId: string | null;
  onSelect: (personId: string) => void;
  onPersonUpdated: (person: ImmichPerson) => void;
  onPersonMerged?: (removedPersonId: string, survivor: ImmichPerson) => void;
  emptyMessage?: string;
  /** Shared-scope photo counts per person (from server people index). */
  assetCountByPerson?: Record<string, number>;
};

function SharedPhotoCountBadge({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <span
      className="absolute right-0.5 top-0.5 z-10 min-w-[1.25rem] rounded-sm bg-primary px-1 py-px text-center text-[10px] font-semibold leading-tight text-primary-foreground shadow"
      title={`${count} photos in shared albums`}
    >
      {count}
    </span>
  );
}

function PersonCatalogTile({
  person,
  selected,
  onSelect,
  onPersonUpdated,
  onPersonMerged,
  cataloguePeople,
  sharedPhotoCount,
}: {
  person: ImmichPerson;
  selected: boolean;
  onSelect: () => void;
  onPersonUpdated: (person: ImmichPerson) => void;
  onPersonMerged?: (removedPersonId: string, survivor: ImmichPerson) => void;
  cataloguePeople: ImmichPerson[];
  sharedPhotoCount?: number;
}) {
  return (
    <div
      id={`person-catalog-${person.id}`}
      role="listitem"
      className={cn(
        "flex flex-col overflow-visible rounded-md border border-border bg-card scroll-mt-3",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="relative aspect-square w-full overflow-hidden bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={personThumbnailPath(person.id)}
          alt={person.name || "Person"}
          loading="lazy"
          className="size-full object-cover"
        />
        {sharedPhotoCount != null ? (
          <SharedPhotoCountBadge count={sharedPhotoCount} />
        ) : null}
      </button>
      <div className="p-2" onClick={(e) => e.stopPropagation()}>
        <PersonIdentityEditor
          person={person}
          variant="catalog"
          showFaceThumb={false}
          cataloguePeople={cataloguePeople}
          onPersonUpdated={onPersonUpdated}
          onPersonMerged={onPersonMerged}
        />
      </div>
    </div>
  );
}

export function PersonCatalogGrid({
  people,
  cataloguePeople,
  selectedId,
  onSelect,
  onPersonUpdated,
  onPersonMerged,
  emptyMessage = "No people found on assets in albums shared with the operator. Share an album from Albums first.",
  assetCountByPerson = {},
}: PersonCatalogGridProps) {
  useEffect(() => {
    if (!selectedId) return;
    const el = document.getElementById(`person-catalog-${selectedId}`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selectedId]);

  if (people.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 p-3"
      role="list"
    >
      {people.map((person) => (
        <PersonCatalogTile
          key={person.id}
          person={person}
          selected={person.id === selectedId}
          onSelect={() => onSelect(person.id)}
          onPersonUpdated={onPersonUpdated}
          onPersonMerged={onPersonMerged}
          cataloguePeople={cataloguePeople ?? people}
          sharedPhotoCount={assetCountByPerson[person.id]}
        />
      ))}
    </div>
  );
}
