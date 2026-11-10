# UC-004: Browse album assets in immich-curator

**Primary actor:** Ian  
**Supporting actors:** Immich API (authenticated as Geoff via server-side key)  
**Channel:** immich-curator (LAN Next.js app)  
**Preconditions:**

- `IMMICH_SERVER_URL` and `IMMICH_API_KEY` (Geoff) configured in `.env.local` — **server-side only** ([ADR-0001](../adr/0001-server-side-immich-api.md)).
- Curator **target** has at least one album ([UC-012](./UC-012-configure-curator-identity.md)); list via [UC-009](./UC-009-album-crud-in-curator.md) Read; optional `CURATOR_DEFAULT_ALBUM_ID`.
- Ian can reach the curator on the LAN.

## Main flow

1. Ian opens immich-curator in a browser.
2. Ian selects an album from Geoff’s library (header scope dropdown or **Albums** route — list from [UC-009](./UC-009-album-crud-in-curator.md); default Poundsgate if configured).
3. App loads album metadata and asset list via server Route Handlers → Immich API.
4. Ian filters, sorts, or groups the queue via the grid query bar ([UC-015](./UC-015-filter-sort-group-asset-grids.md), [DES-006](../designs/DES-006-asset-grid-query-bar.md)).
5. On the main image grid, rolling over a detected face shows its rectangle and name. A single click on the name edits it in place. A double click opens that person in People ([UC-014](./UC-014-browse-people-in-shared-albums.md)).
6. Ian selects an asset (tile click); the **RHS curation panel** opens ([UC-003](./UC-003-ian-curate-in-shared-album-immich.md)). Ian may also **tick** tiles or date groups for multi-select; with two or more ticks the panel shows bulk actions ([DES-008](../designs/DES-008-explore-multi-select-actions.md), [UC-005](./UC-005-ian-assign-tags-to-asset.md)). **Clicking the panel preview image** opens the full-screen **AssetPreviewModal** (zoom/pan, faces, optional edit — [UC-018](./UC-018-edit-image-in-preview-modal.md), [UC-019](./UC-019-adjust-faces-in-preview.md)).
7. Ian runs UC-005–UC-008 from the panel or modal, or opens **Albums** for [UC-009](./UC-009-album-crud-in-curator.md) / [UC-010](./UC-010-move-assets-between-albums.md).

## Alternate flows

- **From People:** Double-click an asset description in the person panel → Explore with `?assetId=` (optional `?albumId=`). Single-click a person photo thumb → preview modal without leaving People.
- **Multiple albums:** Ian switches album context (US-002); list scope changes, asset metadata is global per Geoff library.
- **API failure:** App surfaces error; no key material sent to the client.
- **Asset replaced after edit:** Modal reports new asset id; Explore grid remaps selection ([UC-018](./UC-018-edit-image-in-preview-modal.md)).

## Postconditions

- Ian has a working view of album membership for curation or admin tasks.
- No `NEXT_PUBLIC_*` exposure of secrets.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md), [US-002](../user-stories/US-002-split-albums-shared-with-ian.md), [US-005](../user-stories/US-005-edit-image-in-preview-modal.md)  
**Informs:** DES-* (album queue UI, API routes), DES-004, UC-003
