# UC-015: Filter, sort, and group asset grids

**Primary actor:** Ian  
**Supporting actors:** Immich API (target key)  
**Channel:** immich-curator — toolbar above main photo grids  
**Preconditions:**

- Ian is on **Explore**, **Albums** (in-album view), or **People** panel with a photo grid ([UC-004](./UC-004-browse-album-assets-in-curator.md), [UC-009](./UC-009-album-crud-in-curator.md), [UC-014](./UC-014-browse-people-in-shared-albums.md)).
- Assets are loaded via curator → Immich metadata search ([DES-006](../designs/DES-006-asset-grid-query-bar.md)).

## Main flow

1. Ian opens a route with a **main section image grid**.
2. A **query toolbar** appears above the grid: sort, optional group-by, filter presets, and add-filter controls.
3. Ian changes sort (e.g. captured date, file name), adds filters (e.g. favorites, no description), or groups (e.g. by month).
4. Curator calls **`POST /api/immich/assets/query`** → Immich `POST /api/search/metadata` plus client grouping/post-filters.
5. The grid refreshes; count shows total matches; selection/RHS panels behave as before when the selected asset remains visible.

## Alternate flows

- **Empty result:** Inline message; Ian clears filters.
- **Selected asset filtered out:** Selection clears.
- **People panel:** Scope is person + shared albums ([UC-014](./UC-014-browse-people-in-shared-albums.md)).
- **Pagination:** Large albums show total; v1 loads up to configured page size (see DES-006).

## Postconditions

- Grid order and membership reflect Ian’s query until changed or session storage reset.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md), [US-002](../user-stories/US-002-split-albums-shared-with-ian.md)  
**Informs:** [DES-006](../designs/DES-006-asset-grid-query-bar.md), UC-004, UC-014
