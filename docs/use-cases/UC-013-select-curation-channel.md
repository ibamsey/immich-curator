# UC-013: Select curation channel (Immich vs immich-curator)

**Primary actor:** Ian  
**Supporting actors:** Geoff  
**Channel:** Reference — applies across US-001 flows  
**Preconditions:**

- Poundsgate (or sibling) album shared with Ian where applicable.
- immich-curator running with Geoff server-side API key.

## Main flow

Ian chooses where to perform a task:

| Task | Preferred channel | Use case |
|------|-------------------|----------|
| Scan upload to Geoff library + Poundsgate album | dartmoor `import-scanned-photos.sh` | [UC-001](./UC-001-ingest-scanned-photos-poundsgate.md) |
| Write initial description; name faces | Immich UI as **Geoff** | [UC-002](./UC-002-geoff-edit-description-and-name-faces.md) |
| View shared album; allowed invitee edits | Immich UI as **Ian** | [UC-003](./UC-003-ian-curate-in-shared-album-immich.md) |
| Browse album queue; batch context | **immich-curator** | [UC-004](./UC-004-browse-album-assets-in-curator.md) |
| Tags from description | **immich-curator** (or Immich if allowed) | [UC-005](./UC-005-ian-assign-tags-to-asset.md) |
| Map location | **immich-curator** (or Immich if allowed) | [UC-006](./UC-006-ian-set-asset-map-location.md) |
| Fix description typo on Geoff-owned asset | **immich-curator** as Geoff | [UC-007](./UC-007-ian-correct-asset-description.md) |
| Fix person DOB | **immich-curator** as Geoff (or Geoff UI) | [UC-008](./UC-008-ian-correct-person-date-of-birth.md) |
| List / create / share Geoff albums | **immich-curator** **Albums** as Geoff | [UC-009](./UC-009-album-crud-in-curator.md) |
| Move assets between albums | **immich-curator** as Geoff | [UC-010](./UC-010-move-assets-between-albums.md) |

1. Ian identifies the task from Geoff’s workflow state (e.g. description ready → tags).
2. Ian uses the preferred channel from the table.
3. If Immich returns permission error for Ian, Ian retries via curator (same Immich backend, Geoff credentials).

## Alternate flows

- **Geoff-only identification:** Ian never uses sidecar for first-pass description or face naming — Geoff owns that in Immich.

## Postconditions

- Work lands on the channel that satisfies US-001 acceptance (“roles clear in docs”).
- No API key in browser.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md) (Ian two tools)  
**Informs:** DES-* (onboarding copy), implementation plans
