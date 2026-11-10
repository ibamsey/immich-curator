# IP-2026-11-10: Explore multi-select and bulk tags

**Design:** [DES-008](../designs/DES-008-explore-multi-select-actions.md)  
**Use cases:** UC-004, UC-005

## Tasks

1. [x] Docs: DES-008; UC-004 step 6 multi-select; UC-005 bulk flow; DES-007 v2 note; floorplan pointer.
2. [x] `use-asset-selection` + tests; `tag-intersection` + tests.
3. [x] Grid ticks (`AssetGrid`, `GroupedAssetGrid`) + `QueryableAssetGridSection` pass-through + `getAssets` on ref.
4. [x] `multi-asset-actions` registry + `MultiAssetActionsPanel`; wire `ExploreWorkspace`.
5. [x] `attachTagToAssets` / `detachTagFromAssets` in `tags.ts`; `PUT`/`DELETE` `/api/immich/tags/assets`.
6. [x] `BulkTagActionBody` + shared tag input where needed.
7. [x] `npm run test`, `npm run lint`, `npm run build`, `systemctl --user restart immich-curator`.

## Verification

- Tick two photos in different date groups; group tick selects section; Clear resets.
- Add `archive/file/batch4` to selection; chips on assets after refetch.
- Remove a catalog tag from intersection; provenance chips not offered for remove.
- Single-tile click still opens curation panel when only one tick.
