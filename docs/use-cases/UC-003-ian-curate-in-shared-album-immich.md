# UC-003: Operator curate in Immich shared album (invitee)

**Primary actor:** Curator operator (Immich invitee; configured in [UC-012](./UC-012-configure-curator-identity.md))  
**Supporting actors:** Curator target (album owner)  
**Channel:** Immich web/mobile UI (**curator operator** login — must match [UC-012](./UC-012-configure-curator-identity.md) `CURATOR_OPERATOR_EMAIL`)  
**Preconditions:**

- **Target** has **shared** the album with **operator** (Editor or Viewer per album policy; [UC-009](./UC-009-album-crud-in-curator.md) Share).
- Operator is logged into Immich with their own account (not the target account).
- Asset appears in the shared album.

## Main flow

1. Operator opens **Shared with me** (or equivalent) → shared album from target.
2. Operator performs curation tasks Immich allows for their **album role** (viewing, comments, some metadata — depends on Immich version and Editor vs Viewer).
3. Operator defers tasks blocked in the shared UI to **immich-curator** acting as **target** ([UC-013](./UC-013-select-curation-channel.md)).

## Alternate flows

- **Editor vs Viewer:** Editor may have broader album actions; owner-only asset fields may still be denied — use curator as **target**.
- **Multiple albums:** Repeat per shared album after US-002 split.

## Postconditions

- Changes allowed by Immich for the operator’s role are persisted.
- Tasks outside that permission set remain for UC-005–UC-008 via curator.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md) (Ian two tools; acceptance: shared album scope)  
**Informs:** [UC-013](./UC-013-select-curation-channel.md), DES-* (parity messaging in UI)
