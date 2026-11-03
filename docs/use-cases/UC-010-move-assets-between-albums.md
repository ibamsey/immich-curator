# UC-010: Move assets between Geoff-owned albums

**Primary actor:** Ian  
**Supporting actors:** Geoff, Immich API  
**Channel:** immich-curator (Geoff API key); Immich UI optional for Geoff  
**Preconditions:**

- Source album (e.g. Poundsgate) and target album (e.g. `Poundsgate · Buildings`) exist on Geoff’s account.
- Ian selected one or more assets to reorganise (same Geoff library).
- Assets are not deleted from library — only album membership changes.

## Main flow

1. Ian opens source album from **Albums** or Explore ([UC-009](./UC-009-album-crud-in-curator.md) Read, [UC-004](./UC-004-browse-album-assets-in-curator.md)).
2. Ian selects assets to move (batch or single); chooses **target album** from Geoff’s full album list (same API as UC-009 Read).
3. Curator **adds** assets to target album via Immich album API.
4. Curator **removes** assets from source album (or Ian confirms remove-after-add policy).
5. Ian verifies assets appear only in intended albums and still exist in Geoff’s library / search.

## Alternate flows

- **Copy vs move:** Policy is **move** (remove from source); if Ian wants duplicate album membership, skip step 4 for those assets.
- **Import path:** New scans still land via [UC-001](./UC-001-ingest-scanned-photos-poundsgate.md); Ian may later move into sibling albums.

## Postconditions

- Album membership updated; **assets remain Geoff-owned**.
- **Metadata unchanged:** description, tags, dates, location ([US-002](../user-stories/US-002-split-albums-shared-with-ian.md) acceptance).
- **People/faces unchanged:** named persons still linked to assets; Explore → People consistent.

**Traces to:** [US-002](../user-stories/US-002-split-albums-shared-with-ian.md)  
**Informs:** DES-* (bulk select, move dialog)
