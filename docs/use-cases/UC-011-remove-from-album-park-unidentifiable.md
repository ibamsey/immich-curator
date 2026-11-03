# UC-011: Remove from album / park unidentifiable

**Primary actor:** Curator operator  
**Supporting actors:** Curator target, Immich server  
**Channel:** immich-curator — RHS asset panel (album-scoped)  
**Preconditions:**

- Asset is in an **in-context album** (Explore or Albums in-album view).
- Operator has album access where Immich requires it for activity; remove-from-album uses **target** API ([ADR-0002](../adr/0002-curator-operator-and-target.md)).

## Main flow

1. Operator selects a photo that should leave the current working album (e.g. not identifiable yet).
2. Operator chooses **Remove from album** (distinct from [UC-003](./UC-003-ian-curate-in-shared-album-immich.md) permanent delete).
3. Curator calls Immich **remove asset from album** as **target** (`DELETE /api/albums/{albumId}/assets` or equivalent bulk API).
4. Optional follow-up: operator moves asset to a configured **parking album** (e.g. “Unidentifiable”) via [UC-010](./UC-010-move-assets-between-albums.md).

## Alternate flows

- **Parking album not configured:** Remove only; asset remains in library under other albums.
- **Last copy in library:** Removing from album does not delete the asset.

## Postconditions

- Asset no longer appears in the in-context album grid.
- Library asset and metadata unchanged unless [UC-003](./UC-003-ian-curate-in-shared-album-immich.md) delete is used separately.

**Traces to:** [US-002](../user-stories/US-002-split-albums-shared-with-ian.md) (organising scans)  
**Informs:** DES-004, follow-up implementation plan after UC-003 v1
