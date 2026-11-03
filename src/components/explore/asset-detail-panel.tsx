"use client";

import { assetThumbnailPath } from "@/lib/immich/assets";
import type { ImmichAsset } from "@/lib/immich/types";

type AssetDetailPanelProps = {
  assetId: string;
  asset: ImmichAsset | null;
  loading: boolean;
};

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

export function AssetDetailPanel({
  assetId,
  asset,
  loading,
}: AssetDetailPanelProps) {
  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading details…</p>
    );
  }

  if (!asset) {
    return (
      <p className="text-sm text-destructive">Could not load asset details.</p>
    );
  }

  const tags = asset.tags?.map((t) => t.name).join(", ") || "—";
  const w = asset.exifInfo?.imageWidth;
  const h = asset.exifInfo?.imageHeight;
  const dimensions = w && h ? `${w} × ${h}` : "—";

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetThumbnailPath(assetId, "preview")}
          alt={asset.originalFileName}
          className="max-h-64 w-full object-contain"
        />
      </div>
      <Field label="File name" value={asset.originalFileName} />
      <Field label="Description" value={asset.description?.trim() || "—"} />
      <Field label="Tags" value={tags} />
      <Field label="Dimensions" value={dimensions} />
      <Field label="Captured" value={formatDate(asset.localDateTime)} />
      <Field label="File created" value={formatDate(asset.fileCreatedAt)} />
      <Field label="Asset ID" value={<code className="text-xs">{assetId}</code>} />
    </div>
  );
}
