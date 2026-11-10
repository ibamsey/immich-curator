# DES-004: Asset curation panel (RHS)

**Traces to:** UC-003, UC-007, UC-011 (stub), [floorplan](./user-interface/floorplan.md)  
**Status:** Accepted

## Goals

- One **AssetCurationPanel** for any route where a single asset is selected and the **RHS context panel** is open (Explore, Albums in-album explore, future surfaces).
- **Target** credentials: description, captured date, permanent delete (bad scans).
- **Operator** credentials: album **activity comments** (create/delete own only).
- No native `alert` / `confirm` ([ADR-0003](../adr/0003-tech-stack-and-engineering-practices.md)).

## Multi-select (Explore)

When two or more grid tiles are ticked, Explore replaces this panel with the bulk action shell ([DES-008](./DES-008-explore-multi-select-actions.md)). Single-tile click + one tick still uses this panel.

## Non-goals (v1)

- UC-011 remove-from-album (disabled stub or label only).
- Edit or delete other users’ comments.

## Panel sections

| Section | Actor | Behaviour |
|---------|-------|-------------|
| Image preview (faces overlay) | Target read | Selecting a grid tile opens the panel; **click the preview image** to open the full-size zoom/pan modal ([`AssetPreviewModal`](../../src/components/grid/asset-preview-modal.tsx)). The grid alone does not open that modal. |
| Preview + read-only meta | Target read | [`AssetMetadataFields`](../../src/components/assets/asset-metadata-fields.tsx): filename, tags, pixel dimensions, **physical size (mm)**, **area (mm²)**, dates ([ADR-0004](../adr/0004-computed-asset-metadata-fields.md)) |
| Description | Target write | Textarea + Save |
| Captured date | Target write | `localDateTime` control + Save |
| Delete asset | Target write | Destructive + `ConfirmDialog` |
| Remove from album | — | Stub “UC-011 — coming soon” |
| Comments | Operator write / all read | See below |

## Comments (Immich album activity)

Immich stores comments as **`type: "comment"`** activities with **`albumId`** + **`assetId`**.

- **Fetch:** `GET /api/immich/activities?albumId=&assetId=` (operator key when configured; else read-only via target where Immich allows).
- **Sort:** `createdAt` **ascending** (oldest at top, compose at bottom) — match Immich web thread order for the same asset.
- **Row:** Author **name** (fallback email), **timestamp**, comment body. Badge **You** when author id matches configured operator.
- **Compose:** Post as operator; refetch thread after success.
- **Delete:** Operator’s rows only → `ConfirmDialog` → `DELETE /api/immich/activities/{id}`.

Requires **`albumId`** from parent workspace; without it, show short explanation instead of thread.

## Server routes

See implementation plan IP-2026-11-03-uc003-asset-curation.md.

## Open questions

- Immich Viewer role: comment compose may 403 — surface Immich error inline.
