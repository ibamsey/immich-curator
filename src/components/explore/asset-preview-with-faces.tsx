"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import { FaceNameBox } from "@/components/people/face-name-box";
import {
  containedImageRect,
  faceBoxOnImage,
  faceBoxPercentStyle,
} from "@/lib/people/face-box-layout";
import {
  patchCachedFacePerson,
  patchCachedFaceUnlinked,
  subscribePersonRenames,
  withPersonName,
} from "@/lib/people/load-asset-faces";
import type { ImmichAssetFace } from "@/lib/immich/types";

type AssetPreviewWithFacesProps = {
  assetId: string;
  alt: string;
  className?: string;
  maxHeightClass?: string;
  /** Click the preview image to open full zoom/pan (Explore RHS). */
  onOpenFullPreview?: () => void;
};

type ImageLayout = {
  containerW: number;
  containerH: number;
  naturalW: number;
  naturalH: number;
};

export function AssetPreviewWithFaces({
  assetId,
  alt,
  className,
  maxHeightClass = "max-h-64",
  onOpenFullPreview,
}: AssetPreviewWithFacesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [faces, setFaces] = useState<ImmichAssetFace[]>([]);
  const [hoveredFaceId, setHoveredFaceId] = useState<string | null>(null);
  const [editingFaceId, setEditingFaceId] = useState<string | null>(null);
  const editingFaceIdRef = useRef<string | null>(null);
  const [layout, setLayout] = useState<ImageLayout | null>(null);

  useEffect(() => {
    editingFaceIdRef.current = editingFaceId;
  }, [editingFaceId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/immich/assets/${assetId}/faces`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { faces?: ImmichAssetFace[] } | null) => {
        if (cancelled) return;
        setFaces(data?.faces ?? []);
      })
      .catch(() => {
        if (!cancelled) setFaces([]);
      });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  useEffect(() => {
    return subscribePersonRenames((personId, name) => {
      setFaces((prev) => withPersonName(prev, personId, name));
    });
  }, []);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const img = container?.querySelector("img");
    if (!container || !img || !img.naturalWidth) return;
    setLayout({
      containerW: container.clientWidth,
      containerH: container.clientHeight,
      naturalW: img.naturalWidth,
      naturalH: img.naturalHeight,
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    return () => ro.disconnect();
  }, [measure]);

  const imageRect =
    layout &&
    containedImageRect(
      layout.containerW,
      layout.containerH,
      layout.naturalW,
      layout.naturalH,
    );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-64 w-full items-center justify-center overflow-hidden rounded-md bg-muted",
        maxHeightClass,
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetThumbnailPath(assetId, "preview")}
        alt={alt}
        className={cn(
          "h-full w-full object-contain",
          maxHeightClass,
          onOpenFullPreview &&
            "cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        onLoad={measure}
        tabIndex={onOpenFullPreview ? 0 : undefined}
        role={onOpenFullPreview ? "button" : undefined}
        aria-label={
          onOpenFullPreview ? "Open full image preview" : undefined
        }
        onClick={
          onOpenFullPreview
            ? (e) => {
                e.preventDefault();
                onOpenFullPreview();
              }
            : undefined
        }
        onKeyDown={
          onOpenFullPreview
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenFullPreview();
                }
              }
            : undefined
        }
      />
      {imageRect && faces.length > 0 ? (
        <div
          className="pointer-events-none absolute"
          style={{
            left: imageRect.x,
            top: imageRect.y,
            width: imageRect.width,
            height: imageRect.height,
          }}
        >
          {faces.map((face) => {
            const box = faceBoxOnImage(
              face,
              layout.naturalW,
              layout.naturalH,
            );
            if (!box) return null;
            const hovered = hoveredFaceId === face.id;
            const editing = editingFaceId === face.id;
            return (
              <FaceNameBox
                key={`${face.id}-${face.person?.id ?? "unlinked"}`}
                faceId={face.id}
                personId={face.person?.id ?? null}
                name={face.person?.name ?? ""}
                className={cn(
                  "box-border border-2 transition-colors",
                  hovered || editing
                    ? "border-primary bg-primary/15"
                    : "border-transparent hover:border-primary/70",
                )}
                style={faceBoxPercentStyle(box)}
                showLabel={hovered || editing}
                onMouseEnter={() => setHoveredFaceId(face.id)}
                onMouseLeave={() => {
                  if (editingFaceIdRef.current === face.id) return;
                  setHoveredFaceId((current) =>
                    current === face.id ? null : current,
                  );
                }}
                onEditingChange={(next) =>
                  setEditingFaceId(next ? face.id : null)
                }
                onSaved={(faceId, person) => {
                  setFaces((prev) =>
                    withPersonName(
                      prev.map((item) =>
                        item.id === faceId ? { ...item, person } : item,
                      ),
                      person.id,
                      person.name,
                    ),
                  );
                  patchCachedFacePerson(assetId, faceId, person);
                }}
                onUnlinked={(faceId) => {
                  setFaces((prev) =>
                    prev.map((item) =>
                      item.id === faceId ? { ...item, person: null } : item,
                    ),
                  );
                  patchCachedFaceUnlinked(assetId, faceId);
                }}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
