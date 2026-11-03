"use client";

import { cn } from "@/lib/utils";
import { personThumbnailPath } from "@/lib/immich/person-thumbnail-path";
import { PersonIdentityEditor } from "@/components/people/person-identity-editor";
import type { ImmichPerson } from "@/lib/immich/types";

type PersonCatalogGridProps = {
  people: ImmichPerson[];
  selectedId: string | null;
  onSelect: (personId: string) => void;
  onPersonUpdated: (person: ImmichPerson) => void;
};

function PersonCatalogTile({
  person,
  selected,
  onSelect,
  onPersonUpdated,
}: {
  person: ImmichPerson;
  selected: boolean;
  onSelect: () => void;
  onPersonUpdated: (person: ImmichPerson) => void;
}) {
  return (
    <div
      role="listitem"
      className={cn(
        "flex flex-col overflow-hidden rounded-md border border-border bg-card",
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
      </button>
      <div className="p-2" onClick={(e) => e.stopPropagation()}>
        <PersonIdentityEditor
          person={person}
          variant="catalog"
          showFaceThumb={false}
          onPersonUpdated={onPersonUpdated}
        />
      </div>
    </div>
  );
}

export function PersonCatalogGrid({
  people,
  selectedId,
  onSelect,
  onPersonUpdated,
}: PersonCatalogGridProps) {
  if (people.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        No people found on assets in albums shared with the operator. Share an
        album from Albums first.
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
        />
      ))}
    </div>
  );
}
