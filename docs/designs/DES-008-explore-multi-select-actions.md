# DES-008: Explore multi-select and bulk action registry

**Traces to:** [UC-004](../use-cases/UC-004-browse-album-assets-in-curator.md), [UC-005](../use-cases/UC-005-ian-assign-tags-to-asset.md), [DES-007](./DES-007-tag-editor.md), [floorplan](./user-interface/floorplan.md), [ADR-0003](../adr/0003-tech-stack-and-engineering-practices.md)  
**Status:** Accepted  
**Supersedes:** DES-007 § v2 bulk tag (implemented here via registry)

## Goals

- Explore thumb grid supports **multi-select** with tile ticks and date-group ticks (same interaction family as People → Duplicates merge selection).
- When two or more assets are ticked, the RHS shows a **multi-select panel** driven by a **registry** of bulk actions (enumerate new actions without rewriting the panel shell).
- First registered action: **bulk tags** (add catalog tag to all; remove tags present on every selected asset). Target key only ([ADR-0001](../adr/0001-server-side-immich-api.md)).

## Non-goals

- Albums / People routes (pass selection props later).
- Bulk delete, move album, or other actions until registered.
- Server-side `filter.tagIds` on the grid ([UC-015](../use-cases/UC-015-filter-sort-group-asset-grids.md)).
- Native `alert` / `confirm`; optional per-action `ConfirmDialog` only when declared in registry.

## Selection UX

| Control | Behaviour |
|---------|-----------|
| Tile tick | Top-left; `stopPropagation`; toggles id in `selectedIds`. Tile click still sets single `selectedId` and loads `AssetCurationPanel`. |
| Selection mode | When `selectedIds.size > 0`, ticks visible on all tiles; selected tiles show ring + light scrim (distinct from single-focus `ring-primary`). |
| Group tick | Beside date group heading; none / partial / all from ids in `group.assets`; click toggles whole group. |
| RHS, 0 ticks | Unchanged: panel follows `selectedId`. |
| RHS, 1 tick | `AssetCurationPanel` plus selection header (count + Clear). |
| RHS, 2+ ticks | `MultiAssetActionsPanel` only (registry sections). |

State: `useAssetSelection` in Explore workspace; optional props through `QueryableAssetGridSection` → `GroupedAssetGrid` → `AssetGrid` (absent = no ticks).

Prune: when query refetch drops ids from the grid, remove them from `selectedIds`.

## Action registry

Module: `src/lib/assets/multi-asset-actions.tsx`

```ts
type MultiAssetAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  Body: ComponentType<MultiAssetActionBodyProps>;
  confirm?: {
    title: string;
    description: (count: number) => string;
    confirmVariant?: "default" | "destructive";
  };
};
```

`MultiAssetActionBodyProps`: `{ assetIds: string[]; assets: GridAsset[]; onDone: () => void }`.

Panel maps `multiAssetActions[]` to labelled sections; runs `ConfirmDialog` when `confirm` is set before `onDone` side effects.

## Bulk tags

| Registry id | UI |
|-------------|-----|
| `bulk-tags-add` | Combobox / Enter-to-create; `PUT /api/immich/tags/assets` |
| `bulk-tags-remove` | List of tags **in common** on all selected assets; × detaches from whole set via `DELETE` same route. Provenance rows shown **locked** (not removable). Tag lists come from `POST /api/immich/assets/bulk-tags` (Immich metadata search does not return `tags` on assets). |
- Partial failures: inline list from Immich per-asset `results`.
- On success: `gridRef.refetch()` via `onDone`.

## API

| Curator route | Immich |
|---------------|--------|
| `PUT /api/immich/tags/assets` | `PUT /api/tags/:id/assets` `{ ids: assetIds[] }` after resolve/upsert |
| `DELETE /api/immich/tags/assets` | `DELETE /api/tags/:id/assets` |

Target key only (`immichJsonTarget`).

## Code map

| Area | Path |
|------|------|
| Selection hook | `src/lib/assets/use-asset-selection.ts` |
| Tag intersection | `src/lib/assets/tag-intersection.ts` |
| Registry | `src/lib/assets/multi-asset-actions.tsx` |
| Panel | `src/components/explore/multi-asset-actions-panel.tsx` |
| Bulk tag add / remove UI | `bulk-tag-action-body.tsx`, `bulk-tag-remove-action-body.tsx` |
| Grid ticks | `src/components/explore/asset-grid.tsx`, `src/components/grid/grouped-asset-grid.tsx` |
| Workspace | `src/components/explore/explore-workspace.tsx` |
