"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import type { AlbumShareRole, ImmichAlbum } from "@/lib/immich/types";

export type CuratorShareConfig = {
  operatorEmail: string | null;
  operatorUserId: string | null;
  defaultShareRole: AlbumShareRole;
};

type AlbumDetailPanelProps = {
  album: ImmichAlbum | null;
  loading: boolean;
  shareConfig: CuratorShareConfig;
  onAlbumUpdated: (album: ImmichAlbum) => void;
};

function formatDate(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function AlbumDetailPanel({
  album,
  loading,
  shareConfig,
  onAlbumUpdated,
}: AlbumDetailPanelProps) {
  const [role, setRole] = useState<AlbumShareRole>(
    shareConfig.defaultShareRole,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [unshareDialogOpen, setUnshareDialogOpen] = useState(false);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading album…</p>
    );
  }

  if (!album) {
    return (
      <p className="text-sm text-muted-foreground">
        Select an album to view details.
      </p>
    );
  }

  const operatorMember = shareConfig.operatorUserId
    ? album.albumUsers?.find(
        (u) => u.user.id === shareConfig.operatorUserId,
      )
    : undefined;

  async function performUnshare() {
    if (!shareConfig.operatorUserId || !operatorMember) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/immich/albums/${album!.id}/share`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Unshare failed");
        return;
      }
      onAlbumUpdated(data as ImmichAlbum);
      setMessage("Operator access removed.");
      setUnshareDialogOpen(false);
    } catch {
      setMessage("Unshare request failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (!shareConfig.operatorUserId) {
      setMessage("Configure operator in Admin / .env.local");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/immich/albums/${album!.id}/share`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Share failed");
        return;
      }
      onAlbumUpdated(data as ImmichAlbum);
      setMessage(operatorMember ? "Role updated." : "Shared with operator.");
    } catch {
      setMessage("Share request failed");
    } finally {
      setSaving(false);
    }
  }

  const thumbId = album.albumThumbnailAssetId;

  return (
    <div className="space-y-4">
      {thumbId ? (
        <div className="overflow-hidden rounded-md bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetThumbnailPath(thumbId)}
            alt=""
            className="max-h-40 w-full object-cover"
          />
        </div>
      ) : null}
      <div>
        <h2 className="text-base font-semibold">{album.albumName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {album.description?.trim() || "No description"}
        </p>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Photos</dt>
          <dd>{album.assetCount}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="text-right">{formatDate(album.updatedAt)}</dd>
        </div>
      </dl>
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Collaborators
        </h3>
        <ul className="mt-2 space-y-1 text-sm">
          {(album.albumUsers ?? []).map((au) => (
            <li key={au.user.id} className="flex justify-between gap-2">
              <span className="truncate">{au.user.email}</span>
              <span className="shrink-0 capitalize text-muted-foreground">
                {au.role}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-md border border-border p-3 space-y-3">
        <h3 className="text-sm font-medium">Share with operator</h3>
        {shareConfig.operatorEmail ? (
          <p className="text-xs text-muted-foreground">
            {shareConfig.operatorEmail}
            {shareConfig.operatorUserId ? null : " (user id not resolved)"}
          </p>
        ) : (
          <p className="text-xs text-destructive">
            Set{" "}
            <Link href="/admin" className="underline">
              CURATOR_OPERATOR_EMAIL
            </Link>
          </p>
        )}
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AlbumShareRole)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={saving || !shareConfig.operatorUserId}
            onClick={handleShare}
          >
            {operatorMember ? "Update role" : "Share album"}
          </Button>
          {operatorMember ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving || !shareConfig.operatorUserId}
              onClick={() => setUnshareDialogOpen(true)}
            >
              Unshare
            </Button>
          ) : null}
        </div>
        {message ? (
          <p className="text-xs text-muted-foreground">{message}</p>
        ) : null}
      </div>
      <ConfirmDialog
        open={unshareDialogOpen}
        onOpenChange={setUnshareDialogOpen}
        title="Unshare album?"
        description={`Remove ${shareConfig.operatorEmail ?? "the operator"} from “${album.albumName}”? They will no longer see this album under Shared with me in Immich.`}
        confirmLabel="Unshare"
        confirmVariant="destructive"
        loading={saving}
        onConfirm={() => void performUnshare()}
      />
    </div>
  );
}
