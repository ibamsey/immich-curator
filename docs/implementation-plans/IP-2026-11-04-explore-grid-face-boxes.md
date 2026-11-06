# IP-2026-11-04: Face rectangles on the Explore grid

**Traces to:** UC-004, DES-001  
**Status:** Done

## Goal

Show Immich face-detection rectangles on the Explore thumbnail grid, aligned with the square cover crop.

## Tasks

1. Map full-image face percentages through `object-cover`.
2. Batch-load faces for tiles near the viewport (`POST /api/immich/assets/faces`).
3. On rollover of a face, draw its rectangle and name on the Explore thumb. Single-click the name to edit it; double-click the name to open that person in People.

## Verification

- [x] `npm run test` covers cover-crop mapping.
- [x] Explore grid shows rectangles; selecting a thumb still opens the panel.

## Out of scope

- Face rectangles on the People detailed list.
- Merge suggestions while renaming from the grid (merge stays on the People page).
