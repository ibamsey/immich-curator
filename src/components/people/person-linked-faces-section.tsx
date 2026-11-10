"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link2Icon, Link2OffIcon } from "lucide-react";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import { faceBoxPercent, faceCropImageStyle } from "@/lib/people/face-box-layout";
import type { ImmichPerson } from "@/lib/immich/types";
import type { UnassignedFace } from "@/lib/people/unassigned-face";
import type { PersonFacePanelRow } from "@/lib/people/person-face-panel-row";
import { preloadAssetOriginals } from "@/lib/people/preload-asset-originals";
import type { LinkedFacePeek } from "@/lib/people/linked-face-peek";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

const LINKED_PAGE_SIZE = 30;

type PersonLinkedFacesSectionProps = {
  person: ImmichPerson;
  onPersonUpdated?: (person: ImmichPerson) => void;
  onFaceUnlinked?: (face: UnassignedFace) => void;
  onFaceLinked?: (face: UnassignedFace) => void;
  activePeekFaceId?: string | null;
  onFaceHover?: (target: LinkedFacePeek | null) => void;
  onFaceClickEdit?: (
    assetId: string,
    faceId: string,
    face: UnassignedFace,
  ) => void;
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
  linkedCountOnAsset,
}: {
  face: UnassignedFace;
  linkedCountOnAsset?: number;
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
    <div
      className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-sm bg-muted"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetThumbnailPath(face.assetId)}
        alt=""
        className={box ? undefined : "size-full object-cover"}
        style={box ? faceCropImageStyle(box) : undefined}
      />
      {linkedCountOnAsset != null && linkedCountOnAsset > 1 ? (
        <span
          className="absolute right-0 top-0 z-10 min-w-[1.1rem] rounded-bl-sm bg-primary px-0.5 text-center text-[9px] font-semibold leading-tight text-primary-foreground shadow"
          title={`${linkedCountOnAsset} linked faces on this photo`}
        >
          {linkedCountOnAsset}
        </span>
      ) : null}
    </div>
  );
}

export function PersonLinkedFacesSection({
  person,
  onPersonUpdated,
  onFaceUnlinked,
  onFaceLinked,
  activePeekFaceId = null,
  onFaceHover,
  onFaceClickEdit,
}: PersonLinkedFacesSectionProps) {
  const [rows, setRows] = useState<PersonFacePanelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [visibleCount, setVisibleCount] = useState(LINKED_PAGE_SIZE);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmUnlinkFace, setConfirmUnlinkFace] =
    useState<UnassignedFace | null>(null);
  const [confirmLinkRow, setConfirmLinkRow] = useState<PersonFacePanelRow | null>(
    null,
  );
  const visibleRows = useMemo(
    () => rows.slice(0, visibleCount),
    [rows, visibleCount],
  );

  useEffect(() => {
    if (visibleRows.length === 0) return;
    preloadAssetOriginals(visibleRows.map((row) => row.face.assetId));
  }, [visibleRows]);

  const fetchRows = useCallback(
    async (mode: "linked" | "scan") => {
      const url =
        mode === "scan"
          ? `/api/immich/people/${person.id}/faces?mode=scan`
          : `/api/immich/people/${person.id}/faces?mode=linked`;
      const res = await fetch(url);
      const data = (await res.json()) as {
        rows?: PersonFacePanelRow[];
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Failed to load faces");
      return data.rows ?? [];
    },
    [person.id],
  );

  const loadLinkedRows = useCallback(() => {
    setLoading(true);
    setError(null);
    setScanDone(false);
    setVisibleCount(LINKED_PAGE_SIZE);
    fetchRows("linked")
      .then(setRows)
      .catch((e: unknown) => {
        setRows([]);
        setError(e instanceof Error ? e.message : "Failed to load faces");
      })
      .finally(() => setLoading(false));
  }, [fetchRows]);

  const runCandidateScan = useCallback(() => {
    setScanLoading(true);
    setError(null);
    fetchRows("scan")
      .then((scanRows) => {
        setRows((prev) => {
          const linkedIds = new Set(
            prev.filter((r) => r.kind === "linked").map((r) => r.face.id),
          );
          const similar = scanRows.filter(
            (r) =>
              r.kind === "similar_unassigned" && !linkedIds.has(r.face.id),
          );
          return [...prev, ...similar];
        });
        setScanDone(true);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Candidate scan failed");
      })
      .finally(() => setScanLoading(false));
  }, [fetchRows]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) loadLinkedRows();
    });
    return () => {
      cancelled = true;
    };
  }, [loadLinkedRows]);

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
      loadLinkedRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unlink failed");
    } finally {
      setPendingId(null);
    }
  }, [confirmUnlinkFace, onFaceUnlinked, loadLinkedRows]);

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
      loadLinkedRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Link failed");
    } finally {
      setPendingId(null);
    }
  }, [confirmLinkRow, person.id, onPersonUpdated, onFaceLinked, loadLinkedRows]);

  const personDisplay = person.name?.trim() || "this person";

  const linkedCountByAsset = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      if (row.kind !== "linked") continue;
      const id = row.face.assetId;
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  const linkedCount = rows.filter((r) => r.kind === "linked").length;
  const hasMore = visibleCount < rows.length;

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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {error ? (
        <p className="shrink-0 text-xs text-destructive">{error}</p>
      ) : null}
      <p className="shrink-0 text-xs text-muted-foreground">
        Hover a row to preview the source photo in the main area; click a row for
        full edit tools. Use “Find similar unassigned faces” to scan the library
        (slow on large libraries).
        {linkedCount > 0 ? ` (${linkedCount} linked)` : ""}
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={scanLoading || scanDone}
          onClick={() => runCandidateScan()}
        >
          {scanLoading
            ? "Scanning…"
            : scanDone
              ? "Candidates loaded"
              : "Find similar unassigned faces"}
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No linked faces in shared albums for this person.
        </p>
      ) : (
        <ul
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5"
          onMouseLeave={() => onFaceHover?.(null)}
        >
          {visibleRows.map((row) => {
            const { face } = row;
            const busy = pendingId !== null;
            const peeking = activePeekFaceId === face.id;
            return (
              <li
                key={face.id}
                className={cn(
                  "flex cursor-pointer items-stretch gap-2 rounded-md border bg-card p-1.5 transition-colors",
                  peeking
                    ? "border-primary ring-1 ring-primary/40"
                    : "border-border hover:border-primary/50",
                  busy && "opacity-60",
                )}
                onMouseEnter={() =>
                  onFaceHover?.({
                    assetId: face.assetId,
                    faceId: face.id,
                    face,
                    rowKind: row.kind,
                  })
                }
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  onFaceClickEdit?.(face.assetId, face.id, face);
                }}
              >
                <FaceRowThumb
                  face={face}
                  linkedCountOnAsset={
                    row.kind === "linked"
                      ? linkedCountByAsset.get(face.assetId)
                      : undefined
                  }
                />
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
      {hasMore ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 self-center text-xs"
          onClick={() => setVisibleCount((n) => n + LINKED_PAGE_SIZE)}
        >
          Load more ({rows.length - visibleCount} remaining)
        </Button>
      ) : null}
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
    </div>
  );
}
