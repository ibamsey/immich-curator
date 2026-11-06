"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { normalizeAssetDetail } from "@/lib/assets/grid-asset";
import { isProvenanceTag, tagPath } from "@/lib/immich/tag-policy";
import type { ImmichAssetWithEnrichment, ImmichTag } from "@/lib/immich/types";

type AssetTagEditorProps = {
  assetId: string;
  asset: ImmichAssetWithEnrichment;
  onAssetUpdated: (asset: ImmichAssetWithEnrichment) => void;
};

export function AssetTagEditor({
  assetId,
  asset,
  onAssetUpdated,
}: AssetTagEditorProps) {
  const [catalog, setCatalog] = useState<ImmichTag[]>([]);
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/immich/tags")
      .then(async (res) => {
        const data: unknown = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(data) || cancelled) return;
        setCatalog(data as ImmichTag[]);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load tags");
      });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  const attachedIds = useMemo(
    () => new Set((asset.tags ?? []).map((tag) => tag.id)),
    [asset.tags],
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog
      .filter((tag) => {
        if (attachedIds.has(tag.id)) return false;
        if (!q) return true;
        return tagPath(tag).toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [attachedIds, catalog, query]);

  async function applyBody(body: { tagId: string } | { value: string }) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/immich/assets/${assetId}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not add tag");
        return;
      }
      const refetch = await fetch(`/api/immich/assets/${assetId}`);
      const payload = refetch.ok ? await refetch.json() : data;
      onAssetUpdated(normalizeAssetDetail(payload as Record<string, unknown>));
      setQuery("");
      setListOpen(false);
      const listed = await fetch("/api/immich/tags");
      if (listed.ok) {
        const next: unknown = await listed.json();
        if (Array.isArray(next)) setCatalog(next as ImmichTag[]);
      }
    } catch {
      setError("Could not add tag");
    } finally {
      setPending(false);
    }
  }

  async function removeTag(tag: ImmichTag) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/immich/assets/${assetId}/tags`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: tag.id }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not remove tag");
        return;
      }
      const refetch = await fetch(`/api/immich/assets/${assetId}`);
      const payload = refetch.ok ? await refetch.json() : data;
      onAssetUpdated(normalizeAssetDetail(payload as Record<string, unknown>));
    } catch {
      setError("Could not remove tag");
    } finally {
      setPending(false);
    }
  }

  function submitQuery() {
    const q = query.trim();
    if (!q || pending) return;
    const exact = catalog.find((tag) => tagPath(tag) === q);
    if (exact) {
      void applyBody({ tagId: exact.id });
      return;
    }
    void applyBody({ value: q });
  }

  const tags = asset.tags ?? [];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Tags
      </p>
      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tags</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const path = tagPath(tag);
            const locked = isProvenanceTag(path);
            return (
              <li
                key={tag.id}
                className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs"
              >
                <span className="truncate" title={path}>
                  {path}
                </span>
                {locked ? null : (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                    disabled={pending}
                    aria-label={`Remove ${path}`}
                    onClick={() => void removeTag(tag)}
                  >
                    ×
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="relative">
        <div className="flex gap-2">
          <input
            value={query}
            disabled={pending}
            placeholder="Tag path"
            aria-label="Add a tag"
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            onChange={(event) => {
              setQuery(event.target.value);
              setListOpen(true);
              setError(null);
            }}
            onFocus={() => setListOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitQuery();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={pending || query.trim().length === 0}
            onClick={() => submitQuery()}
          >
            Add
          </Button>
        </div>
        {listOpen && suggestions.length > 0 ? (
          <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-border bg-background py-1 shadow-sm">
            {suggestions.map((tag) => {
              const path = tagPath(tag);
              return (
                <li key={tag.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto w-full justify-start rounded-none px-2 py-1 text-left font-normal"
                    disabled={pending}
                    onClick={() => void applyBody({ tagId: tag.id })}
                  >
                    <span className="truncate">{path}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
