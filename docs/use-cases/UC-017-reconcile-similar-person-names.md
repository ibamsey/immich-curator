# UC-017: Reconcile similar person names (People → Duplicates)

**Primary actor:** Ian (curator operator)  
**Supporting actors:** Geoff (target library owner), Immich API  
**Channel:** immich-curator **People** route, **Duplicates** tab (`/people?tab=duplicates`)  
**Preconditions:**

- [UC-014](./UC-014-browse-people-in-shared-albums.md): named people catalogue loaded for shared-album scope.
- At least two **distinct Immich person records** have display names that the curator groups as **spelling-similar** (edit distance / normalized spacing — not genealogy rules).
- Ian has authority to merge people and reassign faces as **target** ([UC-012](./UC-012-configure-curator-identity.md)).

## Main flow

1. Ian opens **People** → **Duplicates**.
2. Curator groups named people into clusters (“similar names”); each cluster lists member tiles with name, DOB, and (when the group scrolls into view) linked-face strips loaded lazily (`GET /api/immich/people/:id/faces?mode=linked`).
3. Ian reviews face crops per member to decide whether records are the same individual or coincidentally similar names.
4. Ian selects two or more members for **Merge** (checkbox order: **1 = survivor**, 2+ = sources merged into survivor via `POST /api/immich/people/:id/merge`).
5. Optionally Ian renames the survivor’s display name or DOB in the merge dialog flow ([UC-008](./UC-008-ian-correct-person-date-of-birth.md)).
6. System invalidates the shared people index and refreshes catalogue state; merged-away person ids disappear from groups.

## Alternate flows

- **Reassign without merge:** Ian **drags** a face thumbnail from one member’s strip onto another member’s strip; curator `PUT /api/immich/faces/:faceId` with the destination `personId`. If the source person has no faces left, curator may delete that person record in Immich.
- **Unlink mistaken face:** Ian uses unlink on a face in the strip ([US-003](../user-stories/US-003-people-unlink-face.md)); face may appear on **Faces** tab as an unassigned detection.
- **Open RHS context:** Ian clicks a member tile to open the standard person RHS panel ([UC-014](./UC-014-browse-people-in-shared-albums.md)) while staying on the Duplicates tab list.
- **No groups:** Empty state when no similar-name clusters exist among named people.
- **Birth dates shown only for comparison:** DOB does not form clusters; Ian judges manually.

## Postconditions

- Survivor person holds merged Immich identity; sources removed per Immich merge semantics.
- Face assignments match Ian’s drag/link/unlink actions.
- Catalogue badges and people-in-scope counts reflect changes after server index invalidation / page refresh.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md) (identity hygiene), [US-003](../user-stories/US-003-people-unlink-face.md)  
**Informs:** [DES-005](../designs/DES-005-people-catalogue-and-panel.md) (Duplicates tab), [IP-2026-11-06-duplicates-merge-and-face-dnd](../implementation-plans/IP-2026-11-06-duplicates-merge-and-face-dnd.md)

**Distinct from:** [UC-016](./UC-016-browse-and-delete-duplicates.md) (Immich **asset** duplicate detection on `/duplicates`, not person-name reconciliation).
