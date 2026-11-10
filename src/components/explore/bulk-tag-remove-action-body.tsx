"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  partitionCommonTags,
  tagsInCommon,
} from "@/lib/assets/tag-intersection";
import type { MultiAssetActionBodyProps } from "@/lib/assets/multi-asset-action-types";
import {
  detachTagFromSelection,
  partialUpdateNotice,
} from "@/components/explore/bulk-tag-shared";
import { tagPath } from "@/lib/immich/tag-policy";
import type { ImmichTag } from "@/lib/immich/types";
import type { AssetTagSummary } from "@/lib/immich/asset-tag-summaries";

export function BulkTagRemoveActionBody({
  assetIds,
  onDone,
}: MultiAssetActionBodyProps) {
  const [pendingTagId, setPendingTagId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tagSnapshots, setTagSnapshots] = useState<AssetTagSummary[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadTags = useCallback(() => {
    let cancelled = false;
    setLoadingTags(true);
    setError(null);
    void fetch("/api/immich/assets/bulk-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetIds }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          assets?: AssetTagSummary[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Could not load tags for selection");
          setTagSnapshots([]);
          return;
        }
        setTagSnapshots(data.assets ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load tags for selection");
          setTagSnapshots([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTags(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assetIds]);

  useEffect(() => {
    return loadTags();
  }, [loadTags, reloadKey]);

  const commonTags = useMemo(
    () => tagsInCommon(tagSnapshots),
    [tagSnapshots],
  );
  const { catalog: commonCatalog, provenanceLocked } = useMemo(
    () => partitionCommonTags(commonTags),
    [commonTags],
  );

  async function removeTag(tag: ImmichTag) {
    setPendingTagId(tag.id);
    setError(null);
    setNotice(null);
    try {
      const { ok, data } = await detachTagFromSelection(assetIds, tag.id);
      if (!ok) {
        setError(data.error ?? "Could not remove tag");
        return;
      }
      setNotice(partialUpdateNotice(assetIds, data.results));
      setReloadKey((k) => k + 1);
      onDone();
    } catch {
      setError("Could not remove tag");
    } finally {
      setPendingTagId(null);
    }
  }

  if (loadingTags && tagSnapshots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Loading tags for selection…</p>
    );
  }

  if (commonCatalog.length === 0 && provenanceLocked.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          No tags appear on every selected photo.
        </p>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Tags below are on all selected photos. Remove one from the whole set
        with ×.
      </p>
      <ul className="max-h-64 overflow-auto rounded-md border border-border text-sm">
        {commonCatalog.map((tag) => {
          const path = tagPath(tag);
          const busy = pendingTagId === tag.id;
          return (
            <li
              key={tag.id}
              className="flex items-center gap-2 border-b border-border px-2 py-2 last:border-b-0"
            >
              <span className="min-w-0 flex-1 truncate" title={path}>
                {path}
              </span>
              <button
                type="button"
                className="shrink-0 rounded px-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                disabled={busy || pendingTagId !== null || loadingTags}
                aria-label={`Remove ${path} from all selected`}
                onClick={() => void removeTag(tag)}
              >
                ×
              </button>
            </li>
          );
        })}
        {provenanceLocked.map((tag) => {
          const path = tagPath(tag);
          return (
            <li
              key={tag.id}
              className="flex items-center gap-2 border-b border-dashed border-border bg-muted/30 px-2 py-2 text-muted-foreground last:border-b-0"
              title="Import tags cannot be removed in bulk"
            >
              <span className="min-w-0 flex-1 truncate">{path}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-wide">
                locked
              </span>
            </li>
          );
        })}
      </ul>
      {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
