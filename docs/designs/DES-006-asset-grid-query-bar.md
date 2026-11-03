# DES-006: Asset grid query bar

**Traces to:** UC-015, [floorplan](./user-interface/floorplan.md)  
**Status:** Accepted

## Goals

- Shared **toolbar** above Explore, Albums in-album, and People panel photo grids.
- **Sort / filter** primarily via Immich **`POST /api/search/metadata`**; **group by** on the client.
- **Field registry** documents every attribute used for query (see [`asset-field-registry.ts`](../../src/lib/assets/asset-field-registry.ts)).

## Toolbar UX

| Control | Behaviour |
|---------|-----------|
| Sort field + direction | Maps to Immich `sortBy` + `order` when supported |
| Group by | Optional; section headers in [`GroupedAssetGrid`](../../src/components/grid/grouped-asset-grid.tsx) |
| Preset chips | No description, No location, Untagged, Favorites, Images only, Videos only |
| Count | `Showing N of total` |

Persistence: `sessionStorage` key per scope (`explore:{albumId}`, `albums:{albumId}`, `people:{personId}`).

## API

`POST /api/immich/assets/query` — body: `scope`, `query`, `page`, `size`. Response: `assets`, `total`, optional `groups`.

## Hybrid engine

1. Map server-capable filters/sort to Immich search body.
2. Normalize hits to **GridAsset**.
3. Apply **client-only** filters (e.g. `hasDescription`, `hasTags`).
4. Re-sort if sort field is client-only.
5. Partition into **groups** when `groupBy` set.

**Computed fields** ([ADR-0004](../adr/0004-computed-asset-metadata-fields.md)): physical width/height/area (mm²) and physical size label are **client-only** — sort, filter (`gt`/`lt` on area), and group (e.g. by area or size label). Grid uses configured default scan DPI; asset detail may refine DPI from file EXIF.

## Non-goals (v1)

- Album/person catalogue grids; Locations map.
- Full query builder for every exif field (registry extensible).
