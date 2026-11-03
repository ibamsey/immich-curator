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
5. Ian selects an asset to run UC-005–UC-008 or opens **Albums** for [UC-009](./UC-009-album-crud-in-curator.md) / [UC-010](./UC-010-move-assets-between-albums.md).

## Alternate flows

- **From People:** Double-click an asset in [UC-014](./UC-014-browse-people-in-shared-albums.md) panel → Explore with `?assetId=` (optional `?albumId=`) and asset selected in RHS curation panel.
- **Multiple albums:** Ian switches album context (US-002); list scope changes, asset metadata is global per Geoff library.
- **API failure:** App surfaces error; no key material sent to the client.

## Postconditions

- Ian has a working view of album membership for curation or admin tasks.
- No `NEXT_PUBLIC_*` exposure of secrets.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md), [US-002](../user-stories/US-002-split-albums-shared-with-ian.md)  
**Informs:** DES-* (album queue UI, API routes)
