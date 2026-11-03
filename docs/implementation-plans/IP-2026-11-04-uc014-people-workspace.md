# IP-2026-11-04: UC-014 People workspace

**Traces to:** UC-014, DES-005, UC-004, UC-008, UC-012  
**Status:** Done

## Goal

People route: shared-album person catalogue, inline name/DOB, RHS asset grid, Explore deep link.

## Prerequisites

- UC-012 target key; UC-009 at least one album shared with operator.
- Explore + AssetCurationPanel (UC-003/004).

## Tasks

1. Docs: UC-014, DES-005, cross-links
2. `shared-album-scope.ts`, `people.ts`, `explore-context.ts`, types
3. API routes under `/api/immich/people`
4. People UI components + `/people` page
5. Explore `searchParams` + `initialSelectedAssetId`
6. lint, build, restart service, STATUS

## Verification

- [x] People lists persons with faces in shared albums only
- [x] Save name/DOB updates Immich person (target)
- [x] Panel grid shows descriptions; scoped assets only
- [x] Double-click opens Explore with asset selected and panel open
- [x] `npm run lint` && `npm run build`
- [x] Face wheel on panel asset select; scroll/click focus; double-click spoke → catalogue
- [x] Shared PersonIdentityEditor in catalogue and panel

## Out of scope

- Face merge/split, hidden people toggle

## Sign-off

[STATUS.md](../use-cases/STATUS.md) UC-014 row when verified.
