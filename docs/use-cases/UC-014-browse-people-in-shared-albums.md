# UC-014: Browse and edit people in shared albums

**Primary actor:** Ian (curator operator)  
**Supporting actors:** Geoff (target library owner), Immich API  
**Channel:** immich-curator **People** route (`/people`)  
**Preconditions:**

- [UC-012](./UC-012-configure-curator-identity.md): target API key and operator identity configured.
- At least one target album is **shared with the operator** ([UC-009](./UC-009-album-crud-in-curator.md)).
- Face detection and person records exist on Geoff-owned assets in those albums ([UC-002](./UC-002-geoff-edit-description-and-name-faces.md)).

## Main flow

1. Ian opens **People** in immich-curator.
2. Server builds the catalogue from a **shared people index**: paginated Immich metadata search over all operator-shared `albumIds` with `withPeople: true`, deriving who appears in scope and **photo counts per person** (cached ~5 minutes on the server). No per-person “probe” search per catalogue load.
3. Main area has **three tabs:**
   - **People** — one tile per **unique display name** (surname-first sort among named persons); optional badge when someone has **≥2 photos** in shared albums (count from index).
   - **Faces** — unnamed cluster persons, then **unassigned detections** (lazy-loaded faces list in shared albums).
   - **Duplicates** — similar **person names** clusters; see [UC-017](./UC-017-reconcile-similar-person-names.md).
4. Ian selects a person; the **RHS context panel** remembers **Photos** vs **Linked faces** in session storage.
5. **Photos** tab: grid of assets for `{ personId, shared albumIds }` via `POST /api/immich/assets/query` with `withPeople: true` and an **exact** total from `POST /api/search/statistics`. Toolbar hidden (fixed default sort). Thumbnail **single-click** opens full-screen preview ([UC-019](./UC-019-adjust-faces-in-preview.md)); badges on thumbs show **multi-person** tags when `asset.people.length > 1`. **Double-click** description row → Explore deep link.
6. Below the grid, selecting a photo shows **AssetFacesSection** (face wheel when multiple people on asset, else **PersonIdentityEditor**).
7. **Linked faces** tab: on load, **linked faces only** in shared scope (`mode=linked`); rows paginated (“Load more”). **Find similar unassigned faces** runs the heavy library scan (`mode=scan`) on demand. Link / unlink with confirm ([US-003](../user-stories/US-003-people-unlink-face.md)).
8. Ian edits name/DOB on catalogue tiles or panel editors; saves as **target**. Naming moves records between **People** and **Faces** tabs; merge-if-same-name on detections.
9. Ian names a detection from **Faces** tab tile or RHS detection panel.
10. Ian **double-clicks** a spoke face in the wheel → catalogue selection switches to that person on the appropriate tab.

## Alternate flows

- **No shared albums:** Empty catalogue with explanation; configure share via Albums ([UC-009](./UC-009-album-crud-in-curator.md)).
- **Open tab directly:** `/people?tab=faces`, `/people?tab=duplicates`, `/people?personId=` (opens **People** or **Faces** depending on whether the person has a display name).
- **Clear DOB:** Empty inputs send `birthDate: null` to Immich.
- **Explore handoff:** Double-click asset row → `/explore?assetId=&albumId=` with shared album resolution ([UC-004](./UC-004-browse-album-assets-in-curator.md)).
- **Face / merge mutations:** Server invalidates shared people index; workspace may `router.refresh()` to refresh photo-count badges.
- **DOB-only fix:** Same UI as [UC-008](./UC-008-ian-correct-person-date-of-birth.md).

## Postconditions

- Person `name` and `birthDate` on Geoff’s library match Ian’s saved values.
- Ian can reach full asset curation and preview tooling from a person’s photos.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md), [US-003](../user-stories/US-003-people-unlink-face.md)  
**Informs:** [DES-005](../designs/DES-005-people-catalogue-and-panel.md), [UC-008](./UC-008-ian-correct-person-date-of-birth.md), [UC-004](./UC-004-browse-album-assets-in-curator.md), [UC-017](./UC-017-reconcile-similar-person-names.md), [UC-015](./UC-015-filter-sort-group-asset-grids.md) (person-scoped query variant)
