# IP-2026-11-09: Face rectangle editing in image edit modal

**Status:** Implemented  
**Traces to:** Preview modal image editing, UC-002 face naming

## Goal

Adjust linked face bounding boxes and add manual faces from the asset preview **image edit** mode, using Immich-compatible pixel coordinates.

## Immich semantics

- Face boxes are stored in **image pixel space** (`boundingBoxX1`…`Y2`, `imageWidth`, `imageHeight`).
- There is **no API to PATCH** an existing face box. Geometry changes use **`DELETE /faces/{id}` (`force: true`)** then **`POST /faces`** with `x,y,width,height`, `assetId`, `personId` (`sourceType: Manual`).
- Curator maps display rectangles through [`face-box-layout.ts`](../../src/lib/people/face-box-layout.ts) using the loaded original’s natural dimensions.

## UI rules

| Rule | Behaviour |
|------|-----------|
| Pen on linked faces only | Unlinked detections have no reposition pen |
| Image edit dirty | Face tools disabled until revert or image save |
| Crop tool active | Face tools disabled |
| Add face | Draw/move rectangle + person autocomplete; confirm create if no match |

## Routes / lib

- `POST /api/immich/faces` — create manual face
- `POST /api/immich/faces/[faceId]/geometry` — replace bbox (delete + create)
- `POST /api/immich/people` — create person (add-face flow)
- [`replaceFaceBoundingBox`](../../src/lib/immich/faces.ts), [`createManualFace`](../../src/lib/immich/faces.ts)

## Verification

- [ ] Linked face: pen → move/resize → save → faces reload with new id, same person
- [ ] Cancel restores box
- [ ] Add face: existing person from search
- [ ] Add face: new name → create person confirm
- [ ] Dirty image edit disables face tools
- [ ] Pan/zoom preview (non-edit) face naming unchanged
