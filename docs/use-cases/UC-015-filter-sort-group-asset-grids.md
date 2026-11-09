# UC-015: Filter, sort, and group asset grids

**Primary actor:** Ian  
**Supporting actors:** Immich API (target key)  
**Channel:** immich-curator — toolbar above main photo grids  
**Preconditions:**

- Ian is on **Explore**, **Albums** (in-album view), or **People** RHS **Photos** tab ([UC-004](./UC-004-browse-album-assets-in-curator.md), [UC-009](./UC-009-album-crud-in-curator.md), [UC-014](./UC-014-browse-people-in-shared-albums.md)).
- Assets load via curator → Immich metadata search ([DES-006](../designs/DES-006-asset-grid-query-bar.md)).

## Main flow

1. Ian opens a route with a **main section image grid** (or person-scoped grid in the RHS panel).
2. Where enabled, a **query toolbar** appears: sort, optional group-by, filter presets, and add-filter controls.
3. Ian changes sort (e.g. captured date, file name), adds filters (e.g. favorites, no description), or groups (e.g. by capture day on Explore).
4. Curator calls **`POST /api/immich/assets/query`** → Immich `POST /api/search/metadata` plus client grouping/post-filters. For **person + shared albums** scope, the server also calls **`POST /api/search/statistics`** so the displayed **total** is exact (Immich search `total` alone is page-sized).
5. The grid refreshes; count shows total matches; selection/RHS panels behave as before when the selected asset remains visible.

## Alternate flows

- **Empty result:** Inline message; Ian clears filters.
- **Selected asset filtered out:** Selection clears.
- **People RHS Photos:** Toolbar **hidden**; default sort only; query not persisted in session storage; `withPeople: true` on search for multi-person thumb badges.
- **Pagination:** Large albums show total; v1 loads up to configured page size (see DES-006).

## Postconditions

- Grid order and membership reflect Ian’s query until changed or session storage reset (where persistence is enabled).

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md), [US-002](../user-stories/US-002-split-albums-shared-with-ian.md)  
**Informs:** [DES-006](../designs/DES-006-asset-grid-query-bar.md), UC-004, UC-014
