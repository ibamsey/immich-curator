"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MultiAssetActionBodyProps } from "@/lib/assets/multi-asset-action-types";
import {
  partialUpdateNotice,
  type TagLinkResponse,
} from "@/components/explore/bulk-tag-shared";
import { tagPath } from "@/lib/immich/tag-policy";
import type { ImmichTag } from "@/lib/immich/types";

export function BulkTagActionBody({
  assetIds,
  onDone,
}: MultiAssetActionBodyProps) {
  const [catalog, setCatalog] = useState<ImmichTag[]>([]);
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog
      .filter((tag) => {
        if (!q) return true;
        return tagPath(tag).toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [catalog, query]);

  async function attach(body: { tagId: string } | { value: string }) {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/immich/tags/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetIds, ...body }),
      });
      const data = (await res.json().catch(() => ({}))) as TagLinkResponse;
      if (!res.ok) {
        setError(data.error ?? "Could not add tag");
        return;
      }
      setNotice(partialUpdateNotice(assetIds, data.results));
      setQuery("");
      setListOpen(false);
      onDone();
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

  function submitQuery() {
    const q = query.trim();
    if (!q || pending) return;
    const exact = catalog.find((tag) => tagPath(tag) === q);
    if (exact) {
      void attach({ tagId: exact.id });
      return;
    }
    void attach({ value: q });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Add a tag to every selected photo.
      </p>
      <div className="relative">
        <div className="flex gap-2">
          <input
            value={query}
            disabled={pending}
            placeholder="Tag path"
            aria-label="Add tag to selection"
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
                    onClick={() => void attach({ tagId: tag.id })}
                  >
                    <span className="truncate">{path}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
