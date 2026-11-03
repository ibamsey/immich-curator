"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import {
  containedImageRect,
  faceBoxPercent,
  faceDisplayLabel,
} from "@/lib/people/face-box-layout";
import type { ImmichAssetFace } from "@/lib/immich/types";

type AssetPreviewWithFacesProps = {
  assetId: string;
  alt: string;
  className?: string;
  maxHeightClass?: string;
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
}: AssetPreviewWithFacesProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [faces, setFaces] = useState<ImmichAssetFace[]>([]);
  const [hoveredFaceId, setHoveredFaceId] = useState<string | null>(null);
  const [layout, setLayout] = useState<ImageLayout | null>(null);

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

  const goToPerson = (face: ImmichAssetFace) => {
    const personId = face.person?.id;
    if (!personId) return;
    router.push(`/people?personId=${encodeURIComponent(personId)}`);
  };

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
        className={cn("h-full w-full object-contain", maxHeightClass)}
        onLoad={measure}
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
            const box = faceBoxPercent(face);
            if (!box) return null;
            const hovered = hoveredFaceId === face.id;
            const clickable = Boolean(face.person?.id);
            return (
              <button
                key={face.id}
                type="button"
                className={cn(
                  "pointer-events-auto absolute box-border border-2 transition-colors",
                  hovered
                    ? "border-primary bg-primary/15"
                    : "border-transparent hover:border-primary/70",
                  clickable ? "cursor-pointer" : "cursor-default",
                )}
                style={{
                  left: `${box.left}%`,
                  top: `${box.top}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                }}
                onMouseEnter={() => setHoveredFaceId(face.id)}
                onMouseLeave={() => setHoveredFaceId(null)}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToPerson(face);
                }}
                aria-label={
                  clickable
                    ? `Double-click to open ${faceDisplayLabel(face)} in People`
                    : faceDisplayLabel(face)
                }
              >
                {hovered ? (
                  <span className="absolute -top-6 left-0 max-w-[12rem] truncate rounded bg-background/95 px-1.5 py-0.5 text-xs font-medium text-foreground shadow-sm">
                    {faceDisplayLabel(face)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
