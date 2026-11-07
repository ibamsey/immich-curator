"use client";

import { useCallback, useEffect, useState } from "react";
import { Link2Icon, Link2OffIcon } from "lucide-react";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import { faceBoxPercent, faceCropImageStyle } from "@/lib/people/face-box-layout";
import type { ImmichPerson } from "@/lib/immich/types";
import type { UnassignedFace } from "@/lib/people/unassigned-face";
import type { PersonFacePanelRow } from "@/lib/people/person-face-panel-row";
import {
  AssetPreviewModal,
  type AssetPreviewTarget,
} from "@/components/grid/asset-preview-modal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

type PersonLinkedFacesSectionProps = {
  person: ImmichPerson;
  onPersonUpdated?: (person: ImmichPerson) => void;
  onFaceUnlinked?: (face: UnassignedFace) => void;
  onFaceLinked?: (face: UnassignedFace) => void;
};

function rowLabel(row: PersonFacePanelRow): string {
  switch (row.kind) {
    case "linked":
      return "Linked to this person";
    case "similar_unassigned": {
      const rank = row.similarityRank;
      return rank != null
        ? `Unlinked · Immich similarity rank ${rank} (lower = closer; vs this person’s cluster)`
        : "Unlinked · similar";
    }
    default:
      return "";
  }
}

function FaceRowThumb({
  face,
  onOpenFullImage,
}: {
  face: UnassignedFace;
  onOpenFullImage: (assetId: string, faceId: string) => void;
}) {
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
    <button
      type="button"
      onClick={() => onOpenFullImage(face.assetId, face.id)}
      className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-sm bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring hover:opacity-90"
      title="Open full image preview (zoom/pan)"
      aria-label="Open full image preview"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetThumbnailPath(face.assetId)}
        alt=""
        className={box ? undefined : "size-full object-cover"}
        style={box ? faceCropImageStyle(box) : undefined}
      />
    </button>
  );
}

export function PersonLinkedFacesSection({
  person,
  onPersonUpdated,
  onFaceUnlinked,
  onFaceLinked,
}: PersonLinkedFacesSectionProps) {
  const [rows, setRows] = useState<PersonFacePanelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmUnlinkFace, setConfirmUnlinkFace] =
    useState<UnassignedFace | null>(null);
  const [confirmLinkRow, setConfirmLinkRow] = useState<PersonFacePanelRow | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<AssetPreviewTarget | null>(
    null,
  );

  const openAssetPreview = useCallback(
    (assetId: string, faceId: string) => {
    setPreviewAsset({
      id: assetId,
      originalFileName: "",
      highlightFaceId: faceId,
    });
    setPreviewOpen(true);
    fetch(`/api/immich/assets/${assetId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data: {
          id?: string;
          originalFileName?: string;
          type?: string;
        } | null) => {
          if (!data?.id) return;
          setPreviewAsset({
            id: data.id,
            originalFileName: String(data.originalFileName ?? ""),
            type: data.type,
            highlightFaceId: faceId,
          });
        },
      )
      .catch(() => {
        /* keep fallback id-only target */
      });
    },
    [],
  );

  const loadRows = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/immich/people/${person.id}/faces`)
      .then(async (res) => {
        const data = (await res.json()) as {
          rows?: PersonFacePanelRow[];
          message?: string;
        };
        if (!res.ok) throw new Error(data.message ?? "Failed to load faces");
        return data.rows ?? [];
      })
      .then(setRows)
      .catch((e: unknown) => {
        setRows([]);
        setError(e instanceof Error ? e.message : "Failed to load faces");
      })
      .finally(() => setLoading(false));
  }, [person.id]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) loadRows();
    });
    return () => {
      cancelled = true;
    };
  }, [loadRows]);

  const runUnlink = useCallback(async () => {
    if (!confirmUnlinkFace) return;
    setPendingId(confirmUnlinkFace.id);
    try {
      const res = await fetch(`/api/immich/faces/${confirmUnlinkFace.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message ?? "Unlink failed");
      }
      onFaceUnlinked?.(confirmUnlinkFace);
      setConfirmUnlinkFace(null);
      loadRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unlink failed");
    } finally {
      setPendingId(null);
    }
  }, [confirmUnlinkFace, onFaceUnlinked, loadRows]);

  const runLink = useCallback(async () => {
    if (!confirmLinkRow) return;
    const faceId = confirmLinkRow.face.id;
    setPendingId(faceId);
    try {
      const res = await fetch(`/api/immich/faces/${faceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id }),
      });
      const data = (await res.json()) as ImmichPerson & { message?: string };
      if (!res.ok) {
        throw new Error(data.message ?? "Link failed");
      }
      onPersonUpdated?.(data);
      onFaceLinked?.(confirmLinkRow.face);
      setConfirmLinkRow(null);
      loadRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Link failed");
    } finally {
      setPendingId(null);
    }
  }, [confirmLinkRow, person.id, onPersonUpdated, onFaceLinked, loadRows]);

  const personDisplay = person.name?.trim() || "this person";

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="text-sm text-muted-foreground">Loading faces…</p>
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const linkedCount = rows.filter((r) => r.kind === "linked").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {error ? (
        <p className="shrink-0 text-xs text-destructive">{error}</p>
      ) : null}
      <p className="shrink-0 text-xs text-muted-foreground">
        All faces linked to this person, plus unlinked faces Immich still clusters with them
        (1-based similarity rank from the people API for each face; lower = closer). Scans a
        large slice of your library per load—huge libraries may not show every match yet. Link or
        unlink.
        {linkedCount > 0 ? ` (${linkedCount} linked)` : ""}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No linked faces found, or nothing similar in the scanned scope.
        </p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
          {rows.map((row) => {
            const { face } = row;
            const busy = pendingId !== null;
            return (
              <li
                key={face.id}
                className={cn(
                  "flex items-stretch gap-2 rounded-md border border-border bg-card p-1.5",
                  busy && "opacity-60",
                )}
              >
                <FaceRowThumb face={face} onOpenFullImage={openAssetPreview} />
                <p className="min-w-0 flex-1 self-center text-xs text-muted-foreground">
                  {rowLabel(row)}
                </p>
                <div className="flex shrink-0 flex-col gap-1 self-center">
                  {row.kind === "similar_unassigned" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-primary"
                      disabled={busy}
                      aria-label="Link this face to this person"
                      title="Link to this person"
                      onClick={() => setConfirmLinkRow(row)}
                    >
                      <Link2Icon className="size-4" />
                    </Button>
                  ) : row.kind === "linked" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={busy}
                      aria-label="Unlink this face from this person"
                      title="Unlink from this person"
                      onClick={() => setConfirmUnlinkFace(face)}
                    >
                      <Link2OffIcon className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog
        open={confirmUnlinkFace !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmUnlinkFace(null);
        }}
        title="Unlink this face?"
        description="This removes the face from this person in Immich. It can show as unidentified or under someone else when it is in scope."
        confirmLabel="Unlink"
        confirmVariant="destructive"
        loading={pendingId !== null}
        onConfirm={runUnlink}
      />
      <ConfirmDialog
        open={confirmLinkRow !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmLinkRow(null);
        }}
        title="Link this face?"
        description={`Assign this unlinked face to ${personDisplay}?`}
        confirmLabel="Link"
        confirmVariant="default"
        loading={pendingId !== null}
        onConfirm={runLink}
      />
      <AssetPreviewModal
        key={
          previewAsset
            ? `${previewAsset.id}-${previewAsset.highlightFaceId ?? ""}`
            : "closed"
        }
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) setPreviewAsset(null);
        }}
        asset={previewAsset}
        onAssetReplaced={(_old, next) => {
          setPreviewAsset((prev) =>
            prev
              ? {
                  id: next.id,
                  originalFileName: next.originalFileName,
                  type: next.type,
                  highlightFaceId: prev.highlightFaceId,
                }
              : null,
          );
          loadRows();
        }}
      />
    </div>
  );
}
