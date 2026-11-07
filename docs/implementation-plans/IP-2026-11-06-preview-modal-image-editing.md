# IP-2026-11-06: Image editing in asset preview modal

**Traces to:** US-005  
**Status:** Done

## Goal

Add crop, quarter-turn rotate, brightness, and contrast in [`src/components/grid/asset-preview-modal.tsx`](../../src/components/grid/asset-preview-modal.tsx), gated by raster format; confirm before save; revert local changes; persist via Immich **POST /api/assets** → **PUT /api/assets/copy** → **DELETE /api/assets** (old id).

## Immich API (dartmoor verification)

- Upload: `POST /api/assets` multipart: `assetData`, `fileCreatedAt`, `fileModifiedAt`, optional `filename`. Response `{ id, status: "created" | "duplicate" }`.
- Copy: `PUT /api/assets/copy` JSON `{ "sourceId": "<old>", "targetId": "<new>" }` → `204`.
- Delete: `DELETE /api/assets` JSON `{ "ids": ["<old>"] }` → `204`.

**Note:** Saving produces a **new asset id**; UI must remap selection and preview state.

## Tasks

1. `HEAD` on [`/api/immich/assets/[id]/original`](../../src/app/api/immich/assets/[assetId]/original/route.ts) for `Content-Type` gating; pure helper + Vitest for editable MIME + filename + `type === IMAGE`.
2. Client: `react-easy-crop` + **Canvas 2D** export (rotate → crop area → `filter` brightness/contrast); disable zoom/pan while editing.
3. Server route: e.g. `POST .../replace-with-upload` orchestrating upload → copy → delete; forward errors.
4. Wire `onAssetReplaced` from modal into Explore and People preview parents; refetch grid/detail.

## Verification

- [x] `npm run lint`, `npm run build`, `npm run test`
- [ ] JPEG: edit → revert clears changes; save → confirm → new id appears in UI (manual)
- [ ] Unsupported type: no edit controls (manual)

## Out of scope

- HEIF/RAW, animated GIF, arbitrary-angle rotation, non-destructive history in Immich
