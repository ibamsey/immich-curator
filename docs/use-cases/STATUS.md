# Use case sign-off status

Living matrix for UC-001–UC-019. Update when implementation or manual verification completes.

| UC | Curator | Ops | Immich UI | Verified | Notes |
|----|---------|-----|-----------|----------|-------|
| [UC-001](./UC-001-ingest-scanned-photos-poundsgate.md) | — | Yes | — | | `import-scanned-photos.sh` |
| [UC-002](./UC-002-geoff-edit-description-and-name-faces.md) | — | — | Manual | | Target in Immich |
| [UC-003](./UC-003-ian-curate-in-shared-album-immich.md) | Yes (v2) | — | Manual | 2026-11-03 ✓ | Panel + preview modal (description, faces, raster edit) |
| [UC-004](./UC-004-browse-album-assets-in-curator.md) | Partial | — | — | 2026-11-04 | Explore + default album; preview modal + face hover |
| [UC-005](./UC-005-ian-assign-tags-to-asset.md) | Yes (v1) | — | — | 2026-11-04 | Single-asset editor writes as target |
| [UC-006](./UC-006-ian-set-asset-map-location.md) | — | — | — | | |
| [UC-007](./UC-007-ian-correct-asset-description.md) | Yes (v1) | — | — | | RHS + modal footer autosave |
| [UC-008](./UC-008-ian-correct-person-date-of-birth.md) | Yes (v1) | — | — | | PersonIdentityEditor on People |
| [UC-009](./UC-009-album-crud-in-curator.md) | Yes (v1) | — | — | 2026-11-03 | List, share/unshare, in-album explore |
| [UC-010](./UC-010-move-assets-between-albums.md) | — | — | — | | |
| [UC-012](./UC-012-configure-curator-identity.md) | Yes | Yes | — | 2026-11-03 ✓ | Admin save/test |
| [UC-013](./UC-013-select-curation-channel.md) | Doc | — | — | | Reference |
| [UC-014](./UC-014-browse-people-in-shared-albums.md) | Yes (v2) | — | — | 2026-11-09 | Shared index; People/Faces/Duplicates tabs; lazy linked faces scan |
| [UC-015](./UC-015-filter-sort-group-asset-grids.md) | Yes (v1) | — | — | 2026-11-04 | Statistics total for person scope |
| [UC-016](./UC-016-browse-and-delete-duplicates.md) | Yes (v1) | — | — | | `/duplicates` asset groups |
| [UC-017](./UC-017-reconcile-similar-person-names.md) | Yes (v1) | — | — | | People tab Duplicates; merge + face DnD |
| [UC-018](./UC-018-edit-image-in-preview-modal.md) | Yes (v1) | — | — | | Crop / rotate / tone; replace asset id |
| [UC-019](./UC-019-adjust-faces-in-preview.md) | Yes (v1) | — | — | | Box edit, add face, unlink |

**Legend:** Curator/Ops/Immich = implemented or operable; **Verified** = sign-off date or initials.
