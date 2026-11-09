# UC-016: Browse and delete suspected duplicate assets

**Primary actor:** Ian (curator operator)  
**Supporting actors:** Immich API (target key)  
**Channel:** immich-curator **`/duplicates`** (side nav — **not** People → Duplicates tab)  
**Preconditions:**

- Curator environment configured ([UC-012](./UC-012-configure-curator-identity.md)).
- Immich exposes duplicate detection; curator can call `GET /api/duplicates` and delete assets the target key is allowed to delete.

## Main flow

1. Ian opens **Duplicates** in the side nav.
2. System loads duplicate **asset** groups from Immich (proxied via `GET /api/immich/duplicates`).
3. Each group shows a horizontal list of thumbnails (curator thumbnail proxy).
4. Ian clicks the delete (bin) control on one asset.
5. System shows a warning dialog; on confirm, curator calls `DELETE /api/immich/assets/:id`.
6. UI removes that asset from the group; if fewer than two assets remain, the group row disappears.

## Alternate flows

- **No groups:** Empty state when Immich reports no duplicates.
- **Permission failure:** Inline error from Immich; asset remains.

## Postconditions

- Removed asset is deleted in Immich (subject to server permissions and trash policy).

**Traces to:** [US-004](../user-stories/US-004-review-duplicate-photos.md)  
**Informs:** [ADR-0001](../adr/0001-server-side-immich-api.md)

**Distinct from:** [UC-017](./UC-017-reconcile-similar-person-names.md) (person **name** clusters on `/people?tab=duplicates`).
