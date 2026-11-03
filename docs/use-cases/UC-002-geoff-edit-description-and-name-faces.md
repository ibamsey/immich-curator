# UC-002: Geoff edit description and name faces on photos

**Primary actor:** Geoff  
**Supporting actors:** Ian (shared album access)  
**Channel:** Immich web/mobile UI (Geoff login)  
**Preconditions:**

- Asset is in Geoff’s library (Poundsgate or another Geoff-owned shared album).
- Geoff is logged in as `geoff.bamsey952@gmail.com`.
- Face detection has run (or Geoff triggers re-scan if needed).

## Main flow

1. Geoff opens **Albums** → Poundsgate (or e.g. `Poundsgate · Buildings` after US-002).
2. Geoff selects a photo.
3. Geoff edits **description** (event, place, people, context).
4. Geoff opens the face/people UI, assigns or confirms faces, and **names** people (links to person records in Geoff’s library).
5. Ian can read the description in Immich or via curator API for follow-up tagging and location.

## Alternate flows

- **Shared album:** Same steps; album is shared with Ian for visibility — Geoff still acts as **owner** on asset fields Immich allows owners to edit.
- **After album move (US-002):** Asset may appear in a different album; description and named people on the asset are unchanged — Geoff opens whichever album Ian organised.
- **Activity comments:** Geoff or Ian may use album activity for discussion where description is not the right channel (out of scope for replacing description).

## Postconditions

- Asset description and person/face assignments are stored on Geoff-owned asset records.
- Explore → People reflects named persons linked to the asset.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md) (narrative steps 2, ongoing); [US-002](../user-stories/US-002-split-albums-shared-with-ian.md) (Geoff unchanged workflow)  
**Informs:** UC-005–UC-008 (Ian reads Geoff’s description), DES-* (display description in curator)
