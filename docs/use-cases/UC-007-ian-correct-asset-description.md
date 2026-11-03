# UC-007: Ian correct asset description (typo / factual fix)

**Primary actor:** Ian  
**Supporting actors:** Geoff (original author), Immich API  
**Channel:** immich-curator (act as Geoff) — required when shared album UI blocks Ian from editing owner description  
**Preconditions:**

- Geoff has written a description with an error (e.g. “Leusdon” misspelled).
- Ian has confirmed the correction with Geoff or authoritative source when non-obvious.
- Server-side Geoff API key available.

## Main flow

1. Ian opens the asset in curator or Immich and reads the description.
2. Ian edits the description text via curator → Immich asset update (Geoff credentials).
3. Ian saves; Immich stores the updated description on the Geoff-owned asset.
4. Geoff sees corrected text on next open; Ian’s tags/location remain aligned.

## Alternate flows

- **Immich UI as Ian:** If Immich allows invitee description edit on shared album, Ian may fix there ([UC-003](./UC-003-ian-curate-in-shared-album-immich.md)) — on dartmoor, gaps typically drive this UC.
- **Substantive rewrite:** Ian prefers asking Geoff to re-identify via [UC-002](./UC-002-geoff-edit-description-and-name-faces.md) rather than changing meaning without Geoff.

## Postconditions

- Description reflects agreed correction; audit trail via Immich activity if enabled.
- Face names and tags unchanged unless separately updated.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md) (narrative step 4)  
**Informs:** DES-* (description editor), [UC-013](./UC-013-select-curation-channel.md)
