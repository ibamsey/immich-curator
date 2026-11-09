"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import { formatPhysicalSizeSummary } from "@/components/assets/asset-metadata-fields";
import { AssetPreviewModal } from "@/components/grid/asset-preview-modal";
import type { GridAsset } from "@/lib/assets/grid-asset";
import {
  faceBoxPercent,
  faceCropImageStyle,
} from "@/lib/people/face-box-layout";
import type { PersonAssetLinkedFaceHint } from "@/lib/people/person-asset-linked-faces";

type PersonAssetListProps = {
  assets: GridAsset[];
  selectedId: string | null;
  onSelect: (assetId: string) => void;
  onOpenInExplore?: (assetId: string) => void;
  scanDefaultDpi?: number;
  personLinkedFacesByAsset?: Record<string, PersonAssetLinkedFaceHint>;
};

function descriptionSnippet(description: string | undefined, max = 120): string {
  const text = (description ?? "").trim();
  if (!text) return "No description";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function PersonAssetList({
  assets,
  selectedId,
  onSelect,
  onOpenInExplore,
  scanDefaultDpi = 600,
  personLinkedFacesByAsset,
}: PersonAssetListProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<GridAsset | null>(null);

  return (
    <>
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      role="list"
      aria-label="Photos with this person"
    >
      {assets.map((asset) => {
        const selected = asset.id === selectedId;
        const physicalSummary = formatPhysicalSizeSummary(asset, scanDefaultDpi);
        const linkedHint = personLinkedFacesByAsset?.[asset.id];
        const face = linkedHint?.sampleFace;
        const faceBox =
          face &&
          faceBoxPercent({
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
          <div
            key={asset.id}
            role="listitem"
            className={cn(
              "flex gap-2 rounded-md border border-border bg-card p-2 text-left",
              selected &&
                "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
          >
            <button
              type="button"
              onClick={() => {
                onSelect(asset.id);
                setPreviewAsset(asset);
                setPreviewOpen(true);
              }}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-sm bg-muted outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring hover:opacity-90",
              )}
              title="Click to preview (zoom/pan) and select for faces"
              aria-label={`Preview photo ${asset.originalFileName}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetThumbnailPath(asset.id)}
                alt=""
                loading="lazy"
                className={faceBox ? undefined : "size-full object-cover"}
                style={faceBox ? faceCropImageStyle(faceBox) : undefined}
              />
              {linkedHint && linkedHint.count > 1 ? (
                <span
                  className="absolute right-0 top-0 z-10 min-w-[1.1rem] rounded-bl-sm bg-primary px-0.5 text-center text-[9px] font-semibold leading-tight text-primary-foreground shadow"
                  title={`${linkedHint.count} people tagged on this photo`}
                >
                  {linkedHint.count}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => onSelect(asset.id)}
              onDoubleClick={(e) => {
                e.preventDefault();
                onOpenInExplore?.(asset.id);
              }}
              className={cn(
                "min-w-0 flex-1 text-left text-xs text-muted-foreground outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/40 rounded-sm px-0 py-0.5",
              )}
              title="Click to show faces · double-click to open in Explore"
            >
              <p className="line-clamp-2">{descriptionSnippet(asset.description)}</p>
              {physicalSummary ? (
                <p className="mt-0.5 line-clamp-1 text-[11px]">{physicalSummary}</p>
              ) : null}
            </button>
          </div>
        );
      })}
    </div>
    <AssetPreviewModal
      key={previewAsset?.id ?? "closed"}
      open={previewOpen}
      onOpenChange={(open) => {
        setPreviewOpen(open);
        if (!open) setPreviewAsset(null);
      }}
      asset={previewAsset}
    />
    </>
  );
}
