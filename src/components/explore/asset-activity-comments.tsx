"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ImmichActivity } from "@/lib/immich/types";
import { Trash2 } from "lucide-react";

type AssetActivityCommentsProps = {
  albumId: string;
  assetId: string;
  operatorUserId: string | null;
  operatorCommentsEnabled: boolean;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function authorLabel(activity: ImmichActivity): string {
  return activity.user.name?.trim() || activity.user.email || "Unknown user";
}

export function AssetActivityComments({
  albumId,
  assetId,
  operatorUserId,
  operatorCommentsEnabled,
}: AssetActivityCommentsProps) {
  const [activities, setActivities] = useState<ImmichActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    const q = new URLSearchParams({ albumId, assetId });
    return fetch(`/api/immich/activities?${q.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load comments");
        }
        return data.activities ?? [];
      });
  }, [albumId, assetId]);

  useEffect(() => {
    let cancelled = false;
    void load()
      .then((items) => {
        if (!cancelled) {
          setActivities(items);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setActivities([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function handlePost() {
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/immich/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId, assetId, comment: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to post comment");
        return;
      }
      setDraft("");
      const items = await load();
      setActivities(items);
    } catch {
      setError("Failed to post comment");
    } finally {
      setPosting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    setError(null);
    try {
      const q = new URLSearchParams({ albumId });
      const res = await fetch(
        `/api/immich/activities/${deleteId}?${q.toString()}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to delete comment");
        return;
      }
      setDeleteId(null);
      const items = await load();
      setActivities(items);
    } catch {
      setError("Failed to delete comment");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div>
        <h3 className="text-sm font-medium">Comments</h3>
        <p className="text-xs text-muted-foreground">
          Album activity in Immich (shared album thread).
        </p>
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading comments…</p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
      <ul className="max-h-48 space-y-3 overflow-y-auto">
        {activities.length === 0 && !loading ? (
          <li className="text-xs text-muted-foreground">No comments yet.</li>
        ) : null}
        {activities.map((activity) => {
          const isOwn =
            operatorUserId && activity.user.id === operatorUserId;
          return (
            <li
              key={activity.id}
              className="rounded-md border border-border bg-muted/30 px-2 py-2 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium leading-tight">
                    {authorLabel(activity)}
                    {isOwn ? (
                      <span className="ml-1.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                        You
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatWhen(activity.createdAt)}
                  </p>
                </div>
                {isOwn && operatorCommentsEnabled ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Delete comment"
                    onClick={() => setDeleteId(activity.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm">
                {activity.comment}
              </p>
            </li>
          );
        })}
      </ul>
      {operatorCommentsEnabled ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Add a comment as the curator operator…"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <Button
            type="button"
            size="sm"
            disabled={posting || !draft.trim()}
            onClick={() => void handlePost()}
          >
            Post comment
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Set <code className="text-[11px]">IMMICH_OPERATOR_API_KEY</code> in{" "}
          <code className="text-[11px]">.env.local</code> to post comments as
          the operator.
        </p>
      )}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete comment?"
        description="Remove your comment from this album activity thread?"
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
