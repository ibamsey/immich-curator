# DES-003: Albums list and share

**Traces to:** UC-009, [floorplan](./user-interface/floorplan.md)  
**Status:** Accepted

## Route

`/albums` — canvas: album card grid; RHS: album detail + share.

## Album card

- Cover via `/api/immich/assets/{albumThumbnailAssetId}/thumbnail`
- Title, asset count
- Badge if operator appears in `albumUsers`

## RHS panel

| Section | Content |
|---------|---------|
| Meta | Title, description, counts, dates |
| Collaborators | `albumUsers` email + role |
| Share | Operator email/id from config; role select Editor/Viewer; Share, Update role, or **Unshare** (`ConfirmDialog`, not browser confirm) |
| Errors | Missing operator config → link `/admin` |

## API (curator)

- `GET /api/immich/albums`
- `GET /api/immich/albums/[albumId]`
- `PUT /api/immich/albums/[albumId]/share` body `{ role, userId? }`
- `DELETE /api/immich/albums/[albumId]/share` — remove configured operator from album
