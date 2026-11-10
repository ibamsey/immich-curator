"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import { FaceNameBox } from "@/components/people/face-name-box";
import type { ImmichAsset, ImmichAssetFace } from "@/lib/immich/types";
import {
  loadAssetFaces,
  patchCachedFacePerson,
  patchCachedFaceUnlinked,
  subscribePersonRenames,
  withPersonName,
} from "@/lib/people/load-asset-faces";
import {
  faceBoxPercent,
  objectCoverFaceBox,
  type FaceBoxPercent,
} from "@/lib/people/face-box-layout";
import { SelectionTickButton } from "@/components/grid/selection-tick-button";

type PreviewAssetPick = Pick<ImmichAsset, "id" | "originalFileName" | "type">;

type AssetGridProps = {
  assets: ImmichAsset[];
  selectedId: string | null;
  onSelect: (assetId: string) => void;
  /** Optional: open full-image zoom from grid (e.g. special flows); Explore uses RHS preview instead. */
  onPreviewOpen?: (asset: PreviewAssetPick) => void;
  multiSelectedIds?: ReadonlySet<string>;
  selectionMode?: boolean;
  onToggleMultiSelect?: (assetId: string) => void;
};

type PlacedFaceBox = {
  id: string;
  personId: string | null;
  name: string;
  box: FaceBoxPercent;
};

function containsPoint(
  box: FaceBoxPercent,
  point: { x: number; y: number },
): boolean {
  const pad = 1.5;
  return (
    point.x >= box.left - pad &&
    point.x <= box.left + box.width + pad &&
    point.y >= box.top - pad &&
    point.y <= box.top + box.height + pad
  );
}

type Frame = {
  imageWidth: number;
  imageHeight: number;
  containerAspect: number;
};

function placeBoxes(
  faces: ImmichAssetFace[] | null,
  frame: Frame | null,
): PlacedFaceBox[] {
  if (!faces || !frame) return [];
  return faces.flatMap((face) => {
    const percent = faceBoxPercent(face);
    if (!percent) return [];
    const covered = objectCoverFaceBox(
      percent,
      frame.imageWidth,
      frame.imageHeight,
      frame.containerAspect,
    );
    if (!covered) return [];
    return [
      {
        id: face.id,
        personId: face.person?.id ?? null,
        name: face.person?.name ?? "",
        box: covered,
      },
    ];
  });
}

function GridFaceBoxes({ assetId }: { assetId: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const facesRef = useRef<ImmichAssetFace[] | null>(null);
  const frameRef = useRef<Frame | null>(null);
  const editingRef = useRef<string | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [faces, setFaces] = useState<ImmichAssetFace[] | null>(null);
  const [hoveredFaceId, setHoveredFaceId] = useState<string | null>(null);
  const [editingFaceId, setEditingFaceId] = useState<string | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);

  useEffect(() => {
    facesRef.current = faces;
  }, [faces]);
  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  useEffect(() => {
    const host = hostRef.current;
    const tile = host?.parentElement;
    const img = tile?.querySelector("img");
    if (!tile || !img) return;

    let cancelled = false;

    const measure = () => {
      if (!img.naturalWidth || !img.naturalHeight || !tile.clientHeight) return;
      setFrame({
        imageWidth: img.naturalWidth,
        imageHeight: img.naturalHeight,
        containerAspect: tile.clientWidth / tile.clientHeight,
      });
    };

    measure();
    img.addEventListener("load", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(tile);

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        loadAssetFaces(assetId)
          .then((next) => {
            if (!cancelled) setFaces(next);
          })
          .catch(() => {
            if (!cancelled) setFaces([]);
          });
      },
      { rootMargin: "240px" },
    );
    io.observe(tile);

    const onMove = (event: MouseEvent) => {
      const bounds = tile.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const point = {
        x: ((event.clientX - bounds.left) / bounds.width) * 100,
        y: ((event.clientY - bounds.top) / bounds.height) * 100,
      };
      lastPointRef.current = point;
      const hit = placeBoxes(facesRef.current, frameRef.current)
        .filter((placed) => containsPoint(placed.box, point))
        .sort(
          (a, b) => a.box.width * a.box.height - b.box.width * b.box.height,
        )[0];
      if (!hit) return;
      setHoveredFaceId((current) => (current === hit.id ? current : hit.id));
    };
    const onLeave = () => {
      lastPointRef.current = null;
      if (editingRef.current) return;
      setHoveredFaceId(null);
    };
    tile.addEventListener("mousemove", onMove);
    tile.addEventListener("mouseleave", onLeave);

    return () => {
      cancelled = true;
      io.disconnect();
      ro.disconnect();
      img.removeEventListener("load", measure);
      tile.removeEventListener("mousemove", onMove);
      tile.removeEventListener("mouseleave", onLeave);
    };
  }, [assetId]);

  useEffect(() => {
    return subscribePersonRenames((personId, name) => {
      setFaces((prev) => (prev ? withPersonName(prev, personId, name) : prev));
    });
  }, []);

  useEffect(() => {
    const point = lastPointRef.current;
    if (!point) return;
    const hit = placeBoxes(faces, frame)
      .filter((placed) => containsPoint(placed.box, point))
      .sort((a, b) => a.box.width * a.box.height - b.box.width * b.box.height)[0];
    if (hit) setHoveredFaceId((current) => (current === hit.id ? current : hit.id));
  }, [faces, frame]);

  const boxes = placeBoxes(faces, frame);
  const shownId = editingFaceId ?? hoveredFaceId;
  const active = shownId ? boxes.find((placed) => placed.id === shownId) : undefined;

  return (
    <div ref={hostRef} className="pointer-events-none absolute inset-0">
      {active ? (
        <FaceNameBox
          key={`${active.id}-${active.personId ?? "unlinked"}`}
          faceId={active.id}
          personId={active.personId}
          name={active.name}
          className="box-border border border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.7)]"
          style={{
            left: `${active.box.left}%`,
            top: `${active.box.top}%`,
            width: `${active.box.width}%`,
            height: `${active.box.height}%`,
          }}
          onEditingChange={(editing) => {
            const next = editing ? active.id : null;
            editingRef.current = next;
            setEditingFaceId(next);
          }}
          onSaved={(faceId, person) => {
            setFaces((prev) =>
              prev
                ? withPersonName(
                    prev.map((face) =>
                      face.id === faceId ? { ...face, person } : face,
                    ),
                    person.id,
                    person.name,
                  )
                : prev,
            );
            patchCachedFacePerson(assetId, faceId, person);
          }}
          onUnlinked={(faceId) => {
            setFaces((prev) =>
              prev
                ? prev.map((face) =>
                    face.id === faceId ? { ...face, person: null } : face,
                  )
                : prev,
            );
            patchCachedFaceUnlinked(assetId, faceId);
          }}
        />
      ) : null}
    </div>
  );
}

export function AssetGrid({
  assets,
  selectedId,
  onSelect,
  onPreviewOpen,
  multiSelectedIds,
  selectionMode = false,
  onToggleMultiSelect,
}: AssetGridProps) {
  const multiSelectEnabled = Boolean(onToggleMultiSelect && multiSelectedIds);
  if (assets.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        No images in this album.
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-[var(--photo-grid-gap)] p-3"
      role="list"
    >
      {assets.map((asset) => {
        const focused = asset.id === selectedId;
        const ticked =
          multiSelectEnabled && multiSelectedIds!.has(asset.id);
        return (
          <div
            key={asset.id}
            role="listitem"
            tabIndex={0}
            onClick={() => {
              onSelect(asset.id);
              onPreviewOpen?.(asset);
            }}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(asset.id);
                onPreviewOpen?.(asset);
              }
            }}
            className={cn(
              "group relative aspect-square cursor-pointer overflow-hidden rounded-sm bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring",
              focused &&
                "ring-2 ring-primary ring-offset-2 ring-offset-background",
              ticked && !focused && "ring-2 ring-primary/80 ring-offset-2 ring-offset-background",
            )}
          >
            {multiSelectEnabled ? (
              <SelectionTickButton
                className={cn(
                  "absolute left-1.5 top-1.5 z-10",
                  selectionMode
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100",
                  ticked && "opacity-100",
                )}
                selected={ticked}
                ariaLabel={`Select ${asset.originalFileName}`}
                onToggle={() => onToggleMultiSelect!(asset.id)}
              />
            ) : null}
            {ticked ? (
              <div
                className="pointer-events-none absolute inset-0 z-[1] bg-primary/15"
                aria-hidden
              />
            ) : null}
            <div className="absolute inset-0 transition-transform group-hover:scale-[1.02]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetThumbnailPath(asset.id)}
                alt={asset.originalFileName}
                loading="lazy"
                className="size-full object-cover"
              />
              <GridFaceBoxes assetId={asset.id} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
