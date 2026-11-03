# UC-008: Ian correct a person’s date of birth

**Primary actor:** Ian  
**Supporting actors:** Geoff (named the person), Immich API  
**Channel:** immich-curator (act as Geoff) or Immich UI (Geoff login / Ian if permitted)  
**Preconditions:**

- Person record exists in **Geoff’s** People library (created or named via [UC-002](./UC-002-geoff-edit-description-and-name-faces.md)).
- Ian has verified correct DOB (genealogy notes, Geoff confirmation).
- Curator can call Immich person update APIs server-side.

## Main flow

1. Ian locates the person (from asset faces or People search in curator/Immich).
2. Ian opens person details and edits **date of birth** (and related fields if in scope).
3. Curator submits update as Geoff via API.
4. Ian confirms DOB on person page and on face assignments across albums.

## Alternate flows

- **Wrong person merged:** Ian splits or reassigns faces in Immich (Geoff or sidecar) — may exceed minimal DOB fix; document in DES-*.
- **Geoff fixes himself:** Geoff uses Immich UI; Ian skips sidecar.

## Postconditions

- Person record shows corrected DOB for all assets linked to that person in Geoff’s library.
- Album moves do not affect person records ([UC-010](./UC-010-move-assets-between-albums.md)).

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md) (narrative step 5)  
**Informs:** DES-* (person editor)
