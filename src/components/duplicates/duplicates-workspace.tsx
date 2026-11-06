"use client";

import { useCallback, useState } from "react";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { assetThumbnailPath } from "@/lib/immich/asset-thumbnail-path";
import type { ShellContext } from "@/lib/server/shell-context";
import type {
  ImmichAsset,
  ImmichDuplicateGroup,
} from "@/lib/immich/types";

type DuplicatesWorkspaceProps = {
  shell: ShellContext;
  initialGroups: ImmichDuplicateGroup[];
};

type PendingDelete = {
  duplicateId: string;
  assetId: string;
  fileLabel: string;
};

export function DuplicatesWorkspace({
  shell,
  initialGroups,
}: DuplicatesWorkspaceProps) {
  const [groups, setGroups] = useState<ImmichDuplicateGroup[]>(initialGroups);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/immich/duplicates");
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: string }).error)
            : `Request failed (${res.status})`;
        throw new Error(msg);
      }
      if (!Array.isArray(data)) {
        throw new Error("Invalid duplicate list response.");
      }
      setGroups(data as ImmichDuplicateGroup[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load duplicates.");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyRemoveAsset = useCallback(
    (duplicateId: string, assetId: string) => {
      setGroups((prev) => {
        const next: ImmichDuplicateGroup[] = [];
        for (const g of prev) {
          if (g.duplicateId !== duplicateId) {
            next.push(g);
            continue;
          }
          const assets = g.assets.filter((a) => a.id !== assetId);
          if (assets.length >= 2) {
            next.push({
              ...g,
              assets,
              suggestedKeepAssetIds: g.suggestedKeepAssetIds?.filter(
                (id) => id !== assetId,
              ),
            });
          }
        }
        return next;
      });
    },
    [],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const { assetId, duplicateId } = pendingDelete;
    setDeletingId(assetId);
    try {
      const res = await fetch(`/api/immich/assets/${assetId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => null);
        const msg =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: string }).error)
            : `Delete failed (${res.status})`;
        throw new Error(msg);
      }
      applyRemoveAsset(duplicateId, assetId);
      setPendingDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }, [pendingDelete, applyRemoveAsset]);

  const suggestedSetForGroup = (g: ImmichDuplicateGroup) =>
    new Set(g.suggestedKeepAssetIds ?? []);

  return (
    <AppShell
      targetEmail={shell.targetEmail}
      connectionOk={shell.connectionOk}
      headerTitle="Duplicates"
      headerSubtitle={
        loading
          ? "Loading…"
          : error
            ? "Error"
            : `${groups.length} suspected group${groups.length === 1 ? "" : "s"}`
      }
    >
      <div className="p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void load()}
          >
            Refresh
          </Button>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        {loading && groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading duplicates…</p>
        ) : null}

        {!loading && groups.length === 0 && !error ? (
          <p className="text-sm text-muted-foreground">
            No suspected duplicates right now. Run duplicate detection in
            Immich if your server supports it.
          </p>
        ) : null}

        <ul className="flex flex-col gap-6">
          {groups.map((group) => {
            const keepIds = suggestedSetForGroup(group);
            return (
              <li
                key={group.duplicateId}
                className="rounded-lg border border-border bg-card p-3 shadow-sm"
              >
                <p className="mb-3 text-xs text-muted-foreground">
                  Group · {group.assets.length} candidate
                  {group.assets.length === 1 ? "" : "s"}
                  {keepIds.size > 0 ? " · ring = suggested keep" : null}
                </p>
                <div className="flex flex-wrap items-stretch gap-3">
                  {group.assets.map((asset: ImmichAsset) => {
                    const suggested = keepIds.has(asset.id);
                    return (
                      <figure
                        key={asset.id}
                        className={cn(
                          "relative flex w-[120px] shrink-0 flex-col overflow-hidden rounded-md border bg-muted/40",
                          suggested
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={assetThumbnailPath(asset.id, "thumbnail")}
                          alt=""
                          className="aspect-square w-full object-cover"
                          loading="lazy"
                        />
                        <figcaption className="border-t border-border bg-background/95 px-1.5 py-1 text-[10px] leading-tight text-muted-foreground">
                          <span className="line-clamp-2" title={asset.originalFileName}>
                            {asset.originalFileName}
                          </span>
                        </figcaption>
                        <div className="flex justify-end border-t border-border p-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={deletingId === asset.id}
                            aria-label={`Delete duplicate ${asset.originalFileName}`}
                            onClick={() =>
                              setPendingDelete({
                                duplicateId: group.duplicateId,
                                assetId: asset.id,
                                fileLabel: asset.originalFileName,
                              })
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </figure>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this duplicate?"
        description={
          pendingDelete
            ? `This permanently removes "${pendingDelete.fileLabel}" from the library. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        loading={deletingId != null}
        onConfirm={() => void handleConfirmDelete()}
      />
    </AppShell>
  );
}
