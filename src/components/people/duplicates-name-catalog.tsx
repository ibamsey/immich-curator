"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from "react";
import { CheckCircle2, Circle, Link2Off } from "lucide-react";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import { faceBoxPercent, faceCropImageStyle } from "@/lib/people/face-box-layout";
import { isoDateToDisplay } from "@/components/people/dob-input";
import type { ImmichPerson } from "@/lib/immich/types";
import type { PersonFacePanelRow } from "@/lib/people/person-face-panel-row";
import type { UnassignedFace } from "@/lib/people/unassigned-face";
import type { NameSimilarityGroup } from "@/lib/people/name-similarity-groups";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const MAX_FACE_THUMBS = 10;
const FACE_DRAG_TYPE = "application/x-immich-curator-face-move";

type DuplicatesNameCatalogProps = {
  groups: NameSimilarityGroup<ImmichPerson>[];
  selectedId: string | null;
  onSelectPerson: (personId: string) => void;
  onPersonMerged: (removedPersonId: string, survivor: ImmichPerson) => void;
  onPersonUpdated: (person: ImmichPerson) => void;
  onPersonDeleted: (personId: string) => void;
  onFaceUnlinkedFromPerson: (face: UnassignedFace) => void;
};

async function fetchLinkedFacesForPerson(personId: string): Promise<{
  faces: UnassignedFace[];
  error?: string;
}> {
  try {
    const res = await fetch(
      `/api/immich/people/${personId}/faces?mode=linked`,
    );
    const data = (await res.json()) as {
      rows?: PersonFacePanelRow[];
      message?: string;
    };
    if (!res.ok) {
      throw new Error(data.message ?? "Failed to load faces");
    }
    const linked = (data.rows ?? [])
      .filter((r) => r.kind === "linked")
      .map((r) => r.face);
    return { faces: linked };
  } catch (e) {
    return {
      faces: [],
      error: e instanceof Error ? e.message : "Failed to load faces",
    };
  }
}

function LinkedFaceThumb({
  face,
  personId,
  disabled,
  onUnlinkRequest,
}: {
  face: UnassignedFace;
  personId: string;
  disabled: boolean;
  onUnlinkRequest: () => void;
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
      draggable={!disabled}
      onDragStart={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData(
          FACE_DRAG_TYPE,
          JSON.stringify({ faceId: face.id, fromPersonId: personId }),
        );
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "relative size-14 shrink-0 overflow-hidden rounded-sm bg-muted",
        !disabled && "cursor-grab active:cursor-grabbing",
      )}
      title="Drag to another person or use Unlink"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetThumbnailPath(face.assetId)}
        alt=""
        className={box ? undefined : "size-full object-cover"}
        style={box ? faceCropImageStyle(box) : undefined}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={(ev) => {
          ev.stopPropagation();
          onUnlinkRequest();
        }}
        className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-bl-sm bg-background/90 text-muted-foreground shadow-sm outline-none hover:bg-destructive/15 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        aria-label="Unlink face from person"
        title="Unlink face"
      >
        <Link2Off className="size-3" />
      </button>
    </div>
  );
}

function PersonDuplicateColumn({
  person,
  selectedForPanel,
  mergeOrder,
  faces,
  loadError,
  pendingFaceId,
  onToggleMergeSelect,
  onOpenPanel,
  onUnlinkFace,
  onFaceStripDragOver,
  onFaceStripDrop,
}: {
  person: ImmichPerson;
  selectedForPanel: boolean;
  mergeOrder: number | null;
  faces: UnassignedFace[] | undefined;
  loadError?: string;
  pendingFaceId: string | null;
  onToggleMergeSelect: () => void;
  onOpenPanel: () => void;
  onUnlinkFace: (face: UnassignedFace) => void;
  onFaceStripDragOver: (e: DragEvent) => void;
  onFaceStripDrop: (e: DragEvent) => void;
}) {
  const displayName = person.name?.trim() || "Unnamed";
  const dob =
    person.birthDate != null && person.birthDate !== ""
      ? isoDateToDisplay(person.birthDate)
      : "—";

  const loading = faces === undefined;
  const visible = faces === undefined ? [] : faces.slice(0, MAX_FACE_THUMBS);
  const more =
    faces === undefined ? 0 : Math.max(0, faces.length - visible.length);

  const busy = pendingFaceId !== null;

  return (
    <div
      role="group"
      className={cn(
        "relative flex max-w-[min(100%,20rem)] shrink-0 flex-col gap-1.5 rounded-md border border-border bg-card p-2 text-left",
        selectedForPanel &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMergeSelect();
          }}
          className="flex items-center gap-0.5 rounded-md p-0.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          aria-pressed={mergeOrder != null}
          aria-label={
            mergeOrder != null
              ? `Selected for merge, order ${mergeOrder}. Click to deselect.`
              : "Select for merge"
          }
        >
          {mergeOrder != null ? (
            <>
              <CheckCircle2
                className="size-5 shrink-0 text-green-600"
                aria-hidden
              />
              <span className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold leading-none text-foreground">
                {mergeOrder}
              </span>
            </>
          ) : (
            <Circle
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
          )}
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={onOpenPanel}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenPanel();
          }
        }}
        className="cursor-pointer rounded-md pr-7 outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          className="flex min-h-14 flex-wrap gap-1"
          onDragOver={onFaceStripDragOver}
          onDrop={onFaceStripDrop}
        >
          {loading ? (
            <span className="text-xs text-muted-foreground">Loading…</span>
          ) : loadError ? (
            <span className="text-xs text-destructive">{loadError}</span>
          ) : visible.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              No linked faces (drop here)
            </span>
          ) : (
            <>
              {visible.map((face) => (
                <LinkedFaceThumb
                  key={face.id}
                  face={face}
                  personId={person.id}
                  disabled={busy}
                  onUnlinkRequest={() => onUnlinkFace(face)}
                />
              ))}
              {more > 0 ? (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-sm border border-dashed border-border bg-muted/50 text-[10px] text-muted-foreground">
                  +{more}
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="border-t border-border pt-1.5">
          <p className="line-clamp-2 text-xs font-medium leading-tight">
            {displayName}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">DOB: {dob}</p>
        </div>
      </div>
    </div>
  );
}

function groupKey(members: ImmichPerson[]): string {
  return members
    .map((m) => m.id)
    .sort()
    .join(":");
}

function DuplicateGroupSection({
  group,
  selectedPanelPersonId,
  onSelectPerson,
  onPersonMerged,
  onPersonUpdated,
  onPersonDeleted,
  onFaceUnlinkedFromPerson,
}: {
  group: NameSimilarityGroup<ImmichPerson>;
  selectedPanelPersonId: string | null;
  onSelectPerson: (personId: string) => void;
  onPersonMerged: (removedPersonId: string, survivor: ImmichPerson) => void;
  onPersonUpdated: (person: ImmichPerson) => void;
  onPersonDeleted: (personId: string) => void;
  onFaceUnlinkedFromPerson: (face: UnassignedFace) => void;
}) {
  const members = group.members;
  const gKey = groupKey(members);

  const [mergeSelection, setMergeSelection] = useState<string[]>([]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  const [unlinkFace, setUnlinkFace] = useState<UnassignedFace | null>(null);
  const [unlinkPersonId, setUnlinkPersonId] = useState<string | null>(null);

  const [pendingFaceId, setPendingFaceId] = useState<string | null>(null);

  const [facesByPerson, setFacesByPerson] = useState<
    Record<string, UnassignedFace[] | undefined>
  >(() => {
    const next: Record<string, UnassignedFace[] | undefined> = {};
    for (const m of members) next[m.id] = undefined;
    return next;
  });
  const [loadErrorByPerson, setLoadErrorByPerson] = useState<
    Record<string, string | undefined>
  >({});

  // Depend only on `gKey`, not `members`: `duplicateNameGroups` rebuilds new `members`
  // arrays each parent render, so `[gKey, members]` retriggered forever and cancelled
  // every in-flight fetch — faces stayed on "Loading…".
  useEffect(() => {
    const ids = members.map((m) => m.id);
    let cancelled = false;

    void (async () => {
      const results = await Promise.all(
        ids.map((id) =>
          fetchLinkedFacesForPerson(id).then((r) => ({
            id,
            ...r,
          })),
        ),
      );
      if (cancelled) return;
      const facesNext: Record<string, UnassignedFace[] | undefined> = {};
      const errNext: Record<string, string | undefined> = {};
      for (const r of results) {
        facesNext[r.id] = r.faces;
        if (r.error) errNext[r.id] = r.error;
      }
      setFacesByPerson(facesNext);
      setLoadErrorByPerson(errNext);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- members ref changes every render; gKey tracks identity
  }, [gKey]);

  const personById = useMemo(() => {
    const map = new Map<string, ImmichPerson>();
    for (const m of members) map.set(m.id, m);
    return map;
  }, [members]);

  const memberIdSet = useMemo(
    () => new Set(members.map((m) => m.id)),
    [members],
  );

  const toggleMergeSelect = useCallback((personId: string) => {
    setMergeSelection((prev) => {
      const idx = prev.indexOf(personId);
      if (idx >= 0) {
        return prev.filter((id) => id !== personId);
      }
      return [...prev, personId];
    });
  }, []);

  const mergeOrderFor = useCallback(
    (personId: string) => {
      const i = mergeSelection.indexOf(personId);
      return i >= 0 ? i + 1 : null;
    },
    [mergeSelection],
  );

  const runMerge = useCallback(async () => {
    if (mergeSelection.length < 2) return;
    const targetId = mergeSelection[0]!;
    const sources = mergeSelection.slice(1);
    const targetPerson = personById.get(targetId);
    if (!targetPerson) return;

    setMergeLoading(true);
    setMergeError(null);
    try {
      const res = await fetch(`/api/immich/people/${targetId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePersonIds: sources,
          name: targetPerson.name ?? "",
          birthDate: targetPerson.birthDate ?? null,
        }),
      });
      const data = (await res.json()) as {
        person?: ImmichPerson;
        message?: string;
      };
      if (!res.ok || !data.person) {
        throw new Error(data.message ?? "Merge failed");
      }
      const survivor = data.person;
      for (const removedId of sources) {
        onPersonMerged(removedId, survivor);
      }
      onPersonUpdated(survivor);
      setMergeSelection([]);
      setMergeDialogOpen(false);
    } catch (e) {
      setMergeError(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setMergeLoading(false);
    }
  }, [mergeSelection, onPersonMerged, onPersonUpdated, personById]);

  const deletePersonIfNoFacesLeft = useCallback(
    async (personId: string) => {
      try {
        const res = await fetch(`/api/immich/people/${personId}`, {
          method: "DELETE",
        });
        if (!res.ok && res.status !== 204) {
          const data = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(data.message ?? "Failed to delete person");
        }
        onPersonDeleted(personId);
        setMergeSelection((prev) => prev.filter((id) => id !== personId));
      } catch (e) {
        setMergeError(
          e instanceof Error ? e.message : "Failed to delete person",
        );
      }
    },
    [onPersonDeleted],
  );

  const runUnlink = useCallback(async () => {
    if (!unlinkFace || !unlinkPersonId) return;
    const faceIdToRemove = unlinkFace.id;
    const affectedPersonId = unlinkPersonId;
    const faceForDetections = unlinkFace;
    setPendingFaceId(faceIdToRemove);
    setMergeError(null);
    try {
      const res = await fetch(`/api/immich/faces/${faceIdToRemove}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message ?? "Unlink failed");
      }
      setFacesByPerson((prev) => {
        const list = prev[affectedPersonId];
        if (!list) return prev;
        const nextList = list.filter((f) => f.id !== faceIdToRemove);
        const next = {
          ...prev,
          [affectedPersonId]: nextList,
        };
        if (nextList.length === 0) {
          queueMicrotask(() => {
            onFaceUnlinkedFromPerson(faceForDetections);
            void deletePersonIfNoFacesLeft(affectedPersonId);
          });
        }
        return next;
      });
      setUnlinkFace(null);
      setUnlinkPersonId(null);
    } catch (e) {
      setMergeError(e instanceof Error ? e.message : "Unlink failed");
    } finally {
      setPendingFaceId(null);
    }
  }, [
    unlinkFace,
    unlinkPersonId,
    deletePersonIfNoFacesLeft,
    onFaceUnlinkedFromPerson,
  ]);

  const handleFaceStripDragOver = useCallback((e: DragEvent) => {
    if (!e.dataTransfer.types.includes(FACE_DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleFaceStripDrop = useCallback(
    async (toPersonId: string, e: DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData(FACE_DRAG_TYPE);
      if (!raw) return;
      let parsed: { faceId: string; fromPersonId: string };
      try {
        parsed = JSON.parse(raw) as { faceId: string; fromPersonId: string };
      } catch {
        return;
      }
      const { faceId, fromPersonId } = parsed;
      if (fromPersonId === toPersonId) return;
      if (!memberIdSet.has(fromPersonId) || !memberIdSet.has(toPersonId)) {
        return;
      }

      const fromList = facesByPerson[fromPersonId];
      const face = fromList?.find((f) => f.id === faceId);
      if (!face) return;

      setPendingFaceId(faceId);
      setMergeError(null);
      try {
        const res = await fetch(`/api/immich/faces/${faceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId: toPersonId }),
        });
        const data = (await res.json()) as ImmichPerson & { message?: string };
        if (!res.ok) {
          throw new Error(data.message ?? "Move failed");
        }
        onPersonUpdated(data);
        setFacesByPerson((prev) => {
          const next = { ...prev };
          const from = next[fromPersonId];
          const to = next[toPersonId];
          if (from) {
            const fromNext = from.filter((f) => f.id !== faceId);
            next[fromPersonId] = fromNext;
            if (fromNext.length === 0) {
              queueMicrotask(() => {
                void deletePersonIfNoFacesLeft(fromPersonId);
              });
            }
          }
          next[toPersonId] = [...(to ?? []).filter((f) => f.id !== faceId), face];
          return next;
        });
      } catch (err) {
        setMergeError(err instanceof Error ? err.message : "Move failed");
      } finally {
        setPendingFaceId(null);
      }
    },
    [deletePersonIfNoFacesLeft, facesByPerson, memberIdSet, onPersonUpdated],
  );

  const survivorPreview =
    mergeSelection.length > 0 ? personById.get(mergeSelection[0]!) : undefined;
  const sourcePreview =
    mergeSelection.length > 1 ? mergeSelection.slice(1) : [];

  return (
    <section
      className="rounded-lg border border-border bg-muted/20 p-3"
      role="listitem"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Similar names · {group.label}
        </h3>
        {mergeSelection.length >= 2 ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 text-[11px]"
            onClick={() => {
              setMergeError(null);
              setMergeDialogOpen(true);
            }}
          >
            Merge
          </Button>
        ) : null}
      </div>

      {mergeError ? (
        <p className="mb-2 text-xs text-destructive">{mergeError}</p>
      ) : null}

      <p className="mb-2 text-[10px] text-muted-foreground">
        Drag faces between people to reassign. Keyboard: open a person via the
        name block; merge uses the checkbox order (1 = survivor).
      </p>

      <div className="flex flex-wrap gap-3">
        {members.map((person) => (
          <div key={person.id} id={`dup-person-${person.id}`}>
            <PersonDuplicateColumn
              person={person}
              selectedForPanel={person.id === selectedPanelPersonId}
              mergeOrder={mergeOrderFor(person.id)}
              faces={facesByPerson[person.id]}
              loadError={loadErrorByPerson[person.id]}
              pendingFaceId={pendingFaceId}
              onToggleMergeSelect={() => toggleMergeSelect(person.id)}
              onOpenPanel={() => onSelectPerson(person.id)}
              onUnlinkFace={(face) => {
                setMergeError(null);
                setUnlinkFace(face);
                setUnlinkPersonId(person.id);
              }}
              onFaceStripDragOver={handleFaceStripDragOver}
              onFaceStripDrop={(e) => void handleFaceStripDrop(person.id, e)}
            />
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={mergeDialogOpen}
        onOpenChange={(open) => {
          if (!open) setMergeError(null);
          setMergeDialogOpen(open);
        }}
        title="Merge these people?"
        description="All selected people except the first will be merged into the first (survivor). This cannot be undone in the curator."
        confirmLabel="Merge"
        cancelLabel="Cancel"
        loading={mergeLoading}
        onConfirm={() => void runMerge()}
      >
        {survivorPreview ? (
          <div className="space-y-2 rounded-md border border-border bg-muted/40 p-2 text-xs">
            <p className="font-medium text-foreground">Merge direction</p>
            <p>
              <span className="text-muted-foreground">Into (survivor): </span>
              <span className="mr-1 inline-flex min-w-[1.5rem] items-center justify-center rounded bg-primary/15 px-1 font-semibold tabular-nums text-foreground">
                1
              </span>
              {survivorPreview.name?.trim() || "Unnamed"}
            </p>
            {sourcePreview.length > 0 ? (
              <div>
                <p className="text-muted-foreground">Sources (merged away):</p>
                <ul className="list-none space-y-1 pl-0">
                  {sourcePreview.map((id, idx) => {
                    const p = personById.get(id);
                    const orderNum = idx + 2;
                    return (
                      <li key={id} className="flex flex-wrap items-baseline gap-x-1">
                        <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded bg-muted px-1 font-semibold tabular-nums text-foreground">
                          {orderNum}
                        </span>
                        <span>{p?.name?.trim() || "Unnamed"}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={unlinkFace !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUnlinkFace(null);
            setUnlinkPersonId(null);
          }
        }}
        title="Unlink this face?"
        description="This removes the face from this person in Immich. It may appear as unidentified or under another person. If this was the last linked face, the person record is deleted in Immich."
        confirmLabel="Unlink"
        confirmVariant="destructive"
        loading={pendingFaceId !== null && unlinkFace?.id === pendingFaceId}
        onConfirm={() => void runUnlink()}
      />
    </section>
  );
}

export function DuplicatesNameCatalog({
  groups,
  selectedId,
  onSelectPerson,
  onPersonMerged,
  onPersonUpdated,
  onPersonDeleted,
  onFaceUnlinkedFromPerson,
}: DuplicatesNameCatalogProps) {
  const scrollToSelected = useCallback((personId: string | null) => {
    if (!personId) return;
    const el = document.getElementById(`dup-person-${personId}`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToSelected(selectedId);
  }, [selectedId, scrollToSelected]);

  if (groups.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        No pairs or clusters of similar names among named people. Add names on
        the Faces tab, or names need to match more closely (spacing,
        punctuation, or one–two character edits for longer names).
      </p>
    );
  }

  return (
    <div className="space-y-4 p-3" role="list">
      <p className="text-xs text-muted-foreground">
        Named people grouped by similar spelling only (birth dates are shown for
        comparison but are not used to form these groups).
      </p>
      {groups.map((group) => (
        <DuplicateGroupSection
          key={groupKey(group.members)}
          group={group}
          selectedPanelPersonId={selectedId}
          onSelectPerson={onSelectPerson}
          onPersonMerged={onPersonMerged}
          onPersonUpdated={onPersonUpdated}
          onPersonDeleted={onPersonDeleted}
          onFaceUnlinkedFromPerson={onFaceUnlinkedFromPerson}
        />
      ))}
    </div>
  );
}
