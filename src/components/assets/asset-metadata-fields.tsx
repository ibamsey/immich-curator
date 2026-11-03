"use client";

import { ASSET_METADATA_DISPLAY_ROWS } from "@/lib/assets/asset-metadata-display";
import type { ComputeContext } from "@/lib/assets/compute-context";
import { getComputedField } from "@/lib/assets/computed-field-registry";
import type { GridAsset } from "@/lib/assets/grid-asset";
import {
  computePhysicalSizeMm,
  formatAreaMm2,
  formatPhysicalSizeLabel,
  getPixelDimensions,
} from "@/lib/assets/physical-size";
import type {
  CuratorAssetEnrichment,
  ImmichAsset,
} from "@/lib/immich/types";

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function buildComputeContext(
  asset: GridAsset,
  enrichment: CuratorAssetEnrichment | undefined,
  defaultScanDpi: number,
): ComputeContext {
  const res = enrichment?.resolution;
  return {
    defaultScanDpi: res?.source === "default" ? res.dpiX : defaultScanDpi,
    fileResolution: res?.source === "exif" ? res : null,
  };
}

function storedValue(
  asset: GridAsset,
  id: string,
): React.ReactNode {
  switch (id) {
    case "originalFileName":
      return asset.originalFileName;
    case "tags":
      return asset.tags?.map((t) => t.name).join(", ") || "—";
    case "pixelDimensions": {
      const px = getPixelDimensions(asset);
      return px ? `${px.widthPx} × ${px.heightPx} px` : "—";
    }
    case "localDateTime":
      return asset.localDateTime ? formatDate(asset.localDateTime) : "—";
    case "fileCreatedAt":
      return asset.fileCreatedAt ? formatDate(asset.fileCreatedAt) : "—";
    default:
      return "—";
  }
}

const STORED_LABELS: Record<string, string> = {
  originalFileName: "File name",
  tags: "Tags",
  pixelDimensions: "Dimensions (pixels)",
  localDateTime: "Captured",
  fileCreatedAt: "File created",
};

export type AssetMetadataFieldsProps = {
  asset: ImmichAsset | GridAsset;
  enrichment?: CuratorAssetEnrichment;
  defaultScanDpi?: number;
};

export function AssetMetadataFields({
  asset,
  enrichment,
  defaultScanDpi = 600,
}: AssetMetadataFieldsProps) {
  const gridAsset = asset as GridAsset;
  const ctx = buildComputeContext(gridAsset, enrichment, defaultScanDpi);
  const physical = computePhysicalSizeMm(
    gridAsset,
    ctx.defaultScanDpi,
    ctx.fileResolution,
  );

  const dpiNote = physical
    ? physical.resolution.source === "exif"
      ? `DPI from file EXIF (${Math.round(physical.resolution.dpiX)} × ${Math.round(physical.resolution.dpiY)})`
      : `DPI assumed (${Math.round(physical.resolution.dpiX)})`
    : null;

  return (
    <div className="space-y-3">
      {ASSET_METADATA_DISPLAY_ROWS.map((row) => {
        if (row.kind === "stored") {
          return (
            <Field
              key={row.id}
              label={STORED_LABELS[row.id] ?? row.id}
              value={storedValue(gridAsset, row.id)}
            />
          );
        }
        const field = getComputedField(row.id);
        if (!field) return null;
        const raw = field.compute(gridAsset, ctx);
        const display =
          raw == null
            ? "—"
            : field.formatDisplay
              ? field.formatDisplay(raw)
              : String(raw);
        return (
          <Field key={row.id} label={field.label} value={display} />
        );
      })}
      {dpiNote ? (
        <p className="text-xs text-muted-foreground">{dpiNote}</p>
      ) : null}
    </div>
  );
}

/** One-line physical size for compact lists. */
export function formatPhysicalSizeSummary(
  asset: GridAsset,
  defaultScanDpi = 600,
): string | null {
  const size = computePhysicalSizeMm(asset, defaultScanDpi, null);
  if (!size) return null;
  return `${formatPhysicalSizeLabel(size)} · ${formatAreaMm2(size.areaMm2)}`;
}
