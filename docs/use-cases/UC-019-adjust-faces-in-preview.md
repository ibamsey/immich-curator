# UC-019: Adjust face boxes and add faces in preview

**Primary actor:** Ian  
**Supporting actors:** Immich API (target key)  
**Channel:** immich-curator — `AssetPreviewModal` (Explore, Albums, People)  
**Preconditions:**

- Preview open for a photo with known pixel dimensions (curator loads asset metadata and/or original for layout).
- Ian needs to fix Immich face detection geometry or add a face Immich did not detect ([UC-002](./UC-002-geoff-edit-description-and-name-faces.md) gaps).
- Target API key on server ([UC-012](./UC-012-configure-curator-identity.md)).

## Main flow

1. Ian opens full-screen preview; face rectangles and name chips render on the image (layout space, not CSS-transformed with pan/zoom content).
2. For an **existing** linked face, Ian opens geometry edit (pen/handles on the name chip), drags the box or handles, then **Save** or **Cancel**; curator `POST /api/immich/faces/:id/geometry` (Immich delete + recreate with new box).
3. For a **new** face, Ian chooses **Add face**, draws a rectangle on the image, confirms the region, then either **links** to an existing person (search/autocomplete) or **creates** a named person and assigns the face.
4. Ian may **unlink** a face from its person or change assignment via the same in-modal face tools (with confirm where destructive).
5. On success, curator invalidates shared people index where applicable; People catalogue / RHS refresh on navigation or `router.refresh()`.

## Alternate flows

- **Name only, no geometry change:** In-place rename uses face/person PUT flows without entering box edit ([UC-014](./UC-014-browse-people-in-shared-albums.md)).
- **Description in modal footer:** Ian edits asset description in the preview footer; blur autosave syncs Explore RHS when the same asset is selected ([UC-007](./UC-007-ian-correct-asset-description.md)) — orthogonal to face geometry.
- **Image edit mode:** Raster replace ([UC-018](./UC-018-edit-image-in-preview-modal.md)) takes precedence; face tools gated while crop/brightness edit is dirty.

## Postconditions

- Face bounding boxes and person links in Immich match Ian’s saves.
- People-in-shared-scope counts and catalogues eventually reflect new links (index TTL or invalidation).

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md), [US-003](../user-stories/US-003-people-unlink-face.md)  
**Informs:** [IP-2026-11-09-modal-face-geometry](../implementation-plans/IP-2026-11-09-modal-face-geometry.md), DES-004, DES-005

**Distinct from:** [UC-014](./UC-014-browse-people-in-shared-albums.md) catalogue naming and [UC-017](./UC-017-reconcile-similar-person-names.md) merge/drag at person level — this UC is **per-asset** preview tooling.
