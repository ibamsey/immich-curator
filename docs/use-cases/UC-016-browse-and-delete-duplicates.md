# UC-016: Browse and delete suspected duplicates

## Actors

- **Curator** (Ian): uses immich-curator with target API key (server-side).

## Preconditions

- Curator environment is configured (`IMMICH_SERVER_URL`, `IMMICH_API_KEY`).
- Immich exposes duplicate detection; curator can call `GET /api/duplicates` and delete assets the target key is allowed to delete.

## Main flow

1. Curator opens **Duplicates** in the side nav.
2. System loads duplicate groups from Immich (proxied via `GET /api/immich/duplicates`).
3. Each group shows a horizontal list of thumbnails (curator thumbnail proxy).
4. Curator clicks the delete (bin) control on one asset.
5. System shows a warning dialog; on confirm, curator calls `DELETE /api/immich/assets/:id`.
6. UI removes that asset from the group; if fewer than two assets remain, the group row disappears.

## Postconditions

- Removed asset is deleted in Immich (subject to server permissions and trash policy).

## Related

- [US-004](../user-stories/US-004-review-duplicate-photos.md)
- [ADR-0001](../adr/0001-server-side-immich-api.md)
