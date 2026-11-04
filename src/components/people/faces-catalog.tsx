"use client";

import { PersonCatalogGrid } from "@/components/people/person-catalog-grid";
import { DetectionNameField } from "@/components/people/detection-name-field";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import { cn } from "@/lib/utils";
import type { ImmichPerson } from "@/lib/immich/types";
import { faceBoxPercent, faceCropImageStyle } from "@/lib/people/face-box-layout";
import type { UnassignedFace } from "@/lib/people/unassigned-face";

type FacesCatalogProps = {
  clusters: ImmichPerson[];
  detections: UnassignedFace[];
  loadingDetections: boolean;
  detectionsError: string | null;
  cataloguePeople: ImmichPerson[];
  selectedPersonId: string | null;
  selectedFaceId: string | null;
  onSelectPerson: (personId: string) => void;
  onSelectFace: (face: UnassignedFace) => void;
  onOpenFaceInExplore: (assetId: string) => void;
  onPersonUpdated: (person: ImmichPerson) => void;
  onPersonMerged?: (removedPersonId: string, survivor: ImmichPerson) => void;
  onDetectionResolved: (faceId: string, person: ImmichPerson) => void;
};

function DetectionThumb({ face }: { face: UnassignedFace }) {
  const box = faceBoxPercent({
    id: face.id,
    boundingBoxX1: face.boundingBoxX1,
    boundingBoxY1: face.boundingBoxY1,
    boundingBoxX2: face.boundingBoxX2,
    boundingBoxY2: face.boundingBoxY2,
    imageWidth: face.imageWidth,
    imageHeight: face.imageHeight,
    person: null,
  });

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetThumbnailPath(face.assetId)}
        alt=""
        className={box ? undefined : "size-full object-cover"}
        style={box ? faceCropImageStyle(box) : undefined}
      />
    </div>
  );
}

export function FacesCatalog({
  clusters,
  detections,
  loadingDetections,
  detectionsError,
  cataloguePeople,
  selectedPersonId,
  selectedFaceId,
  onSelectPerson,
  onSelectFace,
  onOpenFaceInExplore,
  onPersonUpdated,
  onPersonMerged,
  onDetectionResolved,
}: FacesCatalogProps) {
  return (
    <div className="flex flex-col gap-6 p-3">
      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          From clusters
          <span className="ml-2 font-normal normal-case">{clusters.length}</span>
        </h2>
        {clusters.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">
            No unnamed clusters in shared albums.
          </p>
        ) : (
          <PersonCatalogGrid
            people={clusters}
            cataloguePeople={cataloguePeople}
            selectedId={selectedPersonId}
            onSelect={onSelectPerson}
            onPersonUpdated={onPersonUpdated}
            onPersonMerged={onPersonMerged}
          />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Not identified
          <span className="ml-2 font-normal normal-case">
            {loadingDetections ? "…" : detections.length}
          </span>
        </h2>
        {detectionsError ? (
          <p className="px-1 text-sm text-destructive">{detectionsError}</p>
        ) : null}
        {loadingDetections ? (
          <p className="px-1 text-sm text-muted-foreground">
            Loading unidentified faces…
          </p>
        ) : null}
        {detections.length > 0 ? (
          <div
            className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3"
            role="list"
          >
            {detections.map((face) => (
              <div
                key={face.id}
                id={`detection-${face.id}`}
                role="listitem"
                className={cn(
                  "flex flex-col overflow-visible rounded-md border border-border bg-card",
                  selectedFaceId === face.id &&
                    "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectFace(face)}
                  onDoubleClick={() => onOpenFaceInExplore(face.assetId)}
                  className="relative w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Unnamed face. Click to open, double-click to open the photo in Explore."
                >
                  <DetectionThumb face={face} />
                </button>
                <div className="p-2">
                  <DetectionNameField
                    faceId={face.id}
                    assetId={face.assetId}
                    cataloguePeople={cataloguePeople}
                    onResolved={(person) => onDetectionResolved(face.id, person)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {!loadingDetections && detections.length === 0 && !detectionsError ? (
          <p className="px-1 text-sm text-muted-foreground">
            No unidentified faces in shared albums.
          </p>
        ) : null}
      </section>
    </div>
  );
}
