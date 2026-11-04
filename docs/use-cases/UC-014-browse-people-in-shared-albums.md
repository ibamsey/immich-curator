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
2. App loads persons who appear on at least one asset in the union of operator-shared albums, and splits them into two tabs.
3. **People** shows each named person: face thumbnail, **display name**, and **date of birth** (`dd/mm/yyyy` with a calendar icon). **Faces** shows unnamed cluster persons the same way, then detections that Immich has not assigned to a person (a crop of that face and a name field).
4. Ian selects a person; the **RHS context panel** shows a grid of in-scope assets (thumbnail + description) with the same filter/sort/group toolbar as Explore ([UC-015](./UC-015-filter-sort-group-asset-grids.md)). Selecting a detection shows that photo and a name field.
5. Ian **single-clicks** a photo of a person → below the grid, a **face wheel** shows the catalogue person at the centre and other people from that photo on spokes (scroll to rotate; click a spoke to focus; **PersonIdentityEditor** below for name/DOB). If the photo has only one person, the editor appears without the wheel.
6. Ian edits name/DOB and saves (catalogue tile or panel editor); curator updates as **target**. A new name moves that person onto **People** and selects them. Clearing the name moves them back to **Faces**.
7. Ian names a detection from its tile or panel. Curator creates one person for that face, or, when the name matches someone already named, offers to assign the face to that person. The new or surviving person opens on **People**. Other similar detections stay on **Faces**.
8. Ian **double-clicks** a spoke face → main catalogue selection switches to that person, on the tab that holds them.
9. Ian **double-clicks** an asset → **Explore** with the asset selected ([UC-004](./UC-004-browse-album-assets-in-curator.md), [UC-003](./UC-003-ian-curate-in-shared-album-immich.md) channel B when the album is shared).

## Alternate flows

- **No shared albums:** Empty catalogue with explanation; configure share via Albums ([UC-009](./UC-009-album-crud-in-curator.md)).
- **Unnamed cluster:** Empty name field on the **Faces** tab; Ian assigns a display name as target and the person moves to **People**.
- **Unidentified detection:** Name field on the **Faces** tab. One face becomes one person. A matching name can merge into the existing person instead.
- **Open Faces directly:** `/people?tab=faces`. `/people?personId=` opens **People** when that person has a name, otherwise **Faces**.
- **Clear DOB:** Empty inputs send `birthDate: null` to Immich (not empty string).
- **Asset outside default Explore album:** Explore resolves a **shared** album that contains the asset (prefer configured default album when it contains the asset).
- **DOB-only fix without browsing:** Ian may use the same People UI as [UC-008](./UC-008-ian-correct-person-date-of-birth.md).

## Postconditions

- Person `name` and `birthDate` on Geoff’s library match Ian’s saved values.
- Ian can reach full asset curation from a person’s asset via Explore deep link.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md) (narrative step 5)  
**Informs:** [DES-005](../designs/DES-005-people-catalogue-and-panel.md), [UC-008](./UC-008-ian-correct-person-date-of-birth.md), [UC-004](./UC-004-browse-album-assets-in-curator.md)
