"use client";

import { useCallback, useEffect, useState, startTransition } from "react";
import type {
  AssetQueryGroup,
  GridQuery,
  GridQueryScope,
} from "@/lib/assets/grid-query-types";
import { DEFAULT_GRID_QUERY } from "@/lib/assets/grid-query-types";
import type { GridAsset } from "@/lib/assets/grid-asset";

type QueryResponse = {
  assets: GridAsset[];
  total: number;
  groups: AssetQueryGroup[] | null;
};

function loadStoredQuery(storageKey: string | null): GridQuery {
  if (!storageKey || typeof window === "undefined") return DEFAULT_GRID_QUERY;
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return DEFAULT_GRID_QUERY;
    return { ...DEFAULT_GRID_QUERY, ...JSON.parse(raw) } as GridQuery;
  } catch {
    return DEFAULT_GRID_QUERY;
  }
}

export function useAssetGridQuery(
  scope: GridQueryScope,
  storageKey: string | null,
  options?: { persistQuery?: boolean },
) {
  const persistQuery = options?.persistQuery !== false && storageKey != null;
  const [query, setQueryState] = useState<GridQuery>(() =>
    loadStoredQuery(persistQuery ? storageKey : null),
  );
  const [assets, setAssets] = useState<GridAsset[]>([]);
  const [groups, setGroups] = useState<AssetQueryGroup[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchGeneration, setFetchGeneration] = useState(0);

  const removeAsset = useCallback((assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    setGroups((prev) => {
      if (!prev) return prev;
      const next = prev
        .map((g) => ({
          ...g,
          assets: g.assets.filter((a) => a.id !== assetId),
        }))
        .filter((g) => g.assets.length > 0);
      return next.length > 0 ? next : null;
    });
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  const refetch = useCallback(() => {
    setFetchGeneration((g) => g + 1);
  }, []);

  const setQuery = useCallback(
    (next: GridQuery | ((prev: GridQuery) => GridQuery)) => {
      setQueryState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        if (persistQuery && storageKey) {
          try {
            sessionStorage.setItem(storageKey, JSON.stringify(resolved));
          } catch {
            /* ignore */
          }
        }
        return resolved;
      });
    },
    [persistQuery, storageKey],
  );

  const scopeKey =
    scope.mode === "album"
      ? `album:${scope.albumId}`
      : `personShared:${scope.personId}`;

  const queryKey = JSON.stringify(query);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    fetch("/api/immich/assets/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope,
        query,
        page: 1,
        size: 500,
      }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Query failed"))))
      .then((data: QueryResponse) => {
        if (cancelled) return;
        setAssets(data.assets);
        setGroups(data.groups);
        setTotal(data.total);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setAssets([]);
        setGroups(null);
        setTotal(0);
        setError(e.message ?? "Query failed");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scopeKey/queryKey/fetchGeneration track scope/query/refetch
  }, [scopeKey, queryKey, fetchGeneration]);

  return {
    query,
    setQuery,
    assets,
    groups,
    total,
    loading,
    error,
    removeAsset,
    refetch,
  };
}
