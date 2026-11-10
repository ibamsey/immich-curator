"use client";

import { useCallback, useMemo, useState } from "react";

export type GroupSelectionState = "all" | "some" | "none";

export function groupSelectionState(
  groupIds: readonly string[],
  selectedIds: ReadonlySet<string>,
): GroupSelectionState {
  if (groupIds.length === 0) return "none";
  let hit = 0;
  for (const id of groupIds) {
    if (selectedIds.has(id)) hit += 1;
  }
  if (hit === 0) return "none";
  if (hit === groupIds.length) return "all";
  return "some";
}

export function useAssetSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleMany = useCallback((ids: readonly string[]) => {
    if (ids.length === 0) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const state = groupSelectionState(ids, prev);
      const selectAll = state !== "all";
      for (const id of ids) {
        if (selectAll) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const prune = useCallback((visibleIds: readonly string[]) => {
    const visible = new Set(visibleIds);
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, []);

  const readonlyIds = useMemo(
    () => selectedIds as ReadonlySet<string>,
    [selectedIds],
  );

  const size = selectedIds.size;
  const idList = useMemo(() => [...selectedIds], [selectedIds]);

  return {
    selectedIds: readonlyIds,
    size,
    idList,
    toggle,
    toggleMany,
    clear,
    prune,
    selectionMode: size > 0,
  };
}
