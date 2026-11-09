# UC-007: Ian correct asset description (typo / factual fix)

**Primary actor:** Ian  
**Supporting actors:** Geoff (original author), Immich API  
**Channel:** immich-curator (act as Geoff) — RHS **AssetCurationPanel** and/or **AssetPreviewModal** footer  
**Preconditions:**

- Geoff has written a description with an error (e.g. “Leusdon” misspelled).
- Ian has confirmed the correction with Geoff or authoritative source when non-obvious.
- Server-side Geoff API key available.

## Main flow

1. Ian opens the asset in Explore (or arrives from People via deep link) and selects it so the RHS panel is open ([UC-004](./UC-004-browse-album-assets-in-curator.md)).
2. Ian edits the description in the panel textarea and saves, **or** opens the full-screen preview and edits the description in the modal footer (autosave on blur).
3. Curator updates the asset as target via Immich API.
4. When the preview modal is used from Explore with a live selection, the RHS description stays in sync with the saved value.

## Alternate flows

- **Immich UI as Ian:** If Immich allows invitee description edit on shared album, Ian may fix there ([UC-003](./UC-003-ian-curate-in-shared-album-immich.md)) — on dartmoor, gaps typically drive this UC.
- **Substantive rewrite:** Ian prefers asking Geoff to re-identify via [UC-002](./UC-002-geoff-edit-description-and-name-faces.md) rather than changing meaning without Geoff.
- **People photo list:** Description visible in person grid; primary edit still via preview or Explore RHS.

## Postconditions

- Description reflects agreed correction; audit trail via Immich activity if enabled.
- Face names and tags unchanged unless separately updated.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md) (narrative step 4)  
**Informs:** DES-004, [UC-013](./UC-013-select-curation-channel.md), [UC-003](./UC-003-ian-curate-in-shared-album-immich.md)
