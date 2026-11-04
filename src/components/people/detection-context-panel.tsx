"use client";

import { DetectionNameField } from "@/components/people/detection-name-field";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import type { ImmichPerson } from "@/lib/immich/types";
import type { UnassignedFace } from "@/lib/people/unassigned-face";

type DetectionContextPanelProps = {
  face: UnassignedFace | null;
  cataloguePeople: ImmichPerson[];
  onOpenInExplore: (assetId: string) => void;
  onResolved: (person: ImmichPerson) => void;
};

export function DetectionContextPanel({
  face,
  cataloguePeople,
  onOpenInExplore,
  onResolved,
}: DetectionContextPanelProps) {
  if (!face) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a face to name it.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">Unnamed face</p>
        <p className="text-xs text-muted-foreground">
          Double-click the photo to open it in Explore.
        </p>
      </div>
      <button
        type="button"
        onDoubleClick={() => onOpenInExplore(face.assetId)}
        className="overflow-hidden rounded-md border border-border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Photo containing this face. Double-click to open in Explore."
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetThumbnailPath(face.assetId)}
          alt=""
          className="aspect-square w-full object-cover"
        />
      </button>
      <DetectionNameField
        key={face.id}
        faceId={face.id}
        assetId={face.assetId}
        cataloguePeople={cataloguePeople}
        onResolved={onResolved}
      />
    </div>
  );
}
