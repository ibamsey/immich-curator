"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AssetActivityComments } from "@/components/explore/asset-activity-comments";
import { AssetPreviewWithFaces } from "@/components/explore/asset-preview-with-faces";
import { AssetMetadataFields } from "@/components/assets/asset-metadata-fields";
import { normalizeAssetDetail } from "@/lib/assets/grid-asset";
import type { ImmichAssetWithEnrichment } from "@/lib/immich/types";

export type CurationPanelConfig = {
  operatorUserId: string | null;
  operatorCommentsEnabled: boolean;
};

export type AssetCurationPanelProps = {
  assetId: string;
  albumId: string | null;
  asset: ImmichAssetWithEnrichment | null;
  defaultScanDpi?: number;
  loading: boolean;
  operatorUserId: string | null;
  operatorCommentsEnabled: boolean;
  onAssetUpdated: (asset: ImmichAssetWithEnrichment) => void;
  onAssetDeleted: (assetId: string) => void;
};

function toDatetimeLocalValue(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

export function AssetCurationPanel({
  assetId,
  albumId,
  asset,
  loading,
  operatorUserId,
  operatorCommentsEnabled,
  onAssetUpdated,
  onAssetDeleted,
  defaultScanDpi = 600,
}: AssetCurationPanelProps) {
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

  return (
    <div className="space-y-4">
      <AssetPreviewWithFaces
        assetId={assetId}
        alt={asset.originalFileName}
      />
      <AssetMetadataEditor
        key={asset.id}
        assetId={assetId}
        asset={asset}
        onAssetUpdated={onAssetUpdated}
      />
      <AssetMetadataFields
        asset={asset}
        enrichment={asset.curatorEnrichment}
        defaultScanDpi={defaultScanDpi}
      />
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Asset ID
        </p>
        <code className="text-xs">{assetId}</code>
      </div>
      <AssetDeleteActions assetId={assetId} onAssetDeleted={onAssetDeleted} />
      {albumId ? (
        <AssetActivityComments
          key={`${albumId}-${assetId}`}
          albumId={albumId}
          assetId={assetId}
          operatorUserId={operatorUserId}
          operatorCommentsEnabled={operatorCommentsEnabled}
        />
      ) : (
        <p className="border-t border-border pt-4 text-xs text-muted-foreground">
          Open this photo from an album-scoped view to see and post comments.
        </p>
      )}
    </div>
  );
}

function AssetMetadataEditor({
  assetId,
  asset,
  onAssetUpdated,
}: {
  assetId: string;
  asset: ImmichAssetWithEnrichment;
  onAssetUpdated: (asset: ImmichAssetWithEnrichment) => void;
}) {
  const [description, setDescription] = useState(asset.description ?? "");
  const [capturedLocal, setCapturedLocal] = useState(
    toDatetimeLocalValue(asset.localDateTime),
  );
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaMessage, setMetaMessage] = useState<string | null>(null);

  async function saveMetadata() {
    setSavingMeta(true);
    setMetaMessage(null);
    try {
      const body: { description?: string; localDateTime?: string } = {};
      if (description !== (asset.description ?? "")) {
        body.description = description;
      }
      const isoCaptured = capturedLocal
        ? fromDatetimeLocalValue(capturedLocal)
        : null;
      if (isoCaptured && isoCaptured !== asset.localDateTime) {
        body.localDateTime = isoCaptured;
      }
      if (Object.keys(body).length === 0) {
        setMetaMessage("No changes to save.");
        return;
      }
      const res = await fetch(`/api/immich/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMetaMessage(data.error ?? "Save failed");
        return;
      }
      const refetch = await fetch(`/api/immich/assets/${assetId}`);
      const enriched = refetch.ok
        ? normalizeAssetDetail(
            (await refetch.json()) as Record<string, unknown>,
          )
        : normalizeAssetDetail(data as Record<string, unknown>);
      onAssetUpdated(enriched);
      setMetaMessage("Saved.");
    } catch {
      setMetaMessage("Save failed");
    } finally {
      setSavingMeta(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium uppercase tracking-wide text-muted-foreground">
          Description
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium uppercase tracking-wide text-muted-foreground">
          Captured
        </span>
        <input
          type="datetime-local"
          value={capturedLocal}
          onChange={(e) => setCapturedLocal(e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
      </label>
      <Button
        type="button"
        size="sm"
        disabled={savingMeta}
        onClick={() => void saveMetadata()}
      >
        Save metadata
      </Button>
      {metaMessage ? (
        <p className="text-xs text-muted-foreground">{metaMessage}</p>
      ) : null}
    </div>
  );
}

function AssetDeleteActions({
  assetId,
  onAssetDeleted,
}: {
  assetId: string;
  onAssetDeleted: (assetId: string) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDeleteAsset() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/immich/assets/${assetId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Delete failed");
        return;
      }
      setDeleteOpen(false);
      onAssetDeleted(assetId);
    } catch {
      setError("Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        >
          Delete asset
        </Button>
        <Button type="button" size="sm" variant="outline" disabled title="UC-011">
          Remove from album (UC-011)
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete asset permanently?"
        description="This removes the scan from the target library. This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={deleting}
        onConfirm={() => void confirmDeleteAsset()}
      />
    </div>
  );
}
