# UC-003: Operator curate shared album assets

**Primary actor:** Curator operator  
**Supporting actors:** Curator target (album owner)  
**Channels:** Immich web/mobile (operator login) **or** **immich-curator** RHS asset panel ([DES-004](../designs/DES-004-asset-curation-panel.md))

**Preconditions:**

- **Target** has **shared** the album with **operator** ([UC-009](./UC-009-album-crud-in-curator.md) Share).
- For **Immich UI:** operator logged into Immich (not target).
- For **curator:** `IMMICH_OPERATOR_API_KEY` set for comments; target key for owner metadata/delete ([UC-012](./UC-012-configure-curator-identity.md), [ADR-0002](../adr/0002-curator-operator-and-target.md)).
- Asset appears in the **in-context album** when using comments (album-scoped Explore / Albums view).

---

## Channel A — Immich UI (invitee)

1. Operator opens **Shared with me** → shared album from target.
2. Operator performs tasks Immich allows for their **album role** (viewing, comments, etc.).
3. Owner-only fields → use curator as **target** ([UC-013](./UC-013-select-curation-channel.md)).

---

## Channel B — immich-curator (RHS panel)

When an asset is selected and details show in the **RHS context panel** ([UC-004](./UC-004-browse-album-assets-in-curator.md)):

| Action | API actor | Notes |
|--------|-----------|--------|
| Edit **description** | Target | Same UX as [UC-007](./UC-007-ian-correct-asset-description.md) |
| Edit **captured date** (`localDateTime`) | Target | |
| **Delete asset** (bad scan) | Target | `ConfirmDialog`; not UC-011 |
| **Post comment** | Operator | Album activity; appears as operator in Immich |
| **Delete comment** | Operator | **Own** comments only; never edit/delete target’s comments |
| View comment thread | Read | Sorted by `createdAt` ascending; each row attributed (name/email) |

**Remove from album** (park unidentifiable) → [UC-011](./UC-011-remove-from-album-park-unidentifiable.md) (separate; stub in v1).

---

## Alternate flows

- **Editor vs Viewer:** Viewer may be unable to comment in Immich; show API error inline.
- **No operator API key:** Comments compose disabled; metadata/delete still available as target.
- **No album context:** Comments section explains album-scoped view is required.

## Postconditions

- Operator-visible changes persist in Immich (activity as operator, metadata as target).
- Target and other users’ comments remain read-only in curator.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md)  
**Informs:** [UC-013](./UC-013-select-curation-channel.md), DES-004, [UC-011](./UC-011-remove-from-album-park-unidentifiable.md)
