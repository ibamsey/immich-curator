# IP-2026-11-03: UC-003 Asset curation panel

**Traces to:** UC-003, UC-011 (docs), DES-004, ADR-0002, UC-007 (description UX)  
**Status:** Done

## Goal

Shared RHS **AssetCurationPanel**: target metadata/delete + operator activity comments (ordered, attributed).

## Prerequisites

- Target `IMMICH_API_KEY`; optional `IMMICH_OPERATOR_API_KEY` for comments (must match `CURATOR_OPERATOR_EMAIL` when email set).
- Shared album with operator Editor (or Viewer if Immich allows comments).

## Tasks

1. Docs: UC-003 curator channel, UC-011, DES-004, ADR-0002 operator key, UC-013, STATUS, README
2. Dual Immich client; `activities.ts`, asset update/delete
3. API routes + operator-only activity delete guard
4. `AssetCurationPanel` + wire Explore / Albums explore
5. Admin operator key status
6. Verify, lint/build, systemd restart

## Verification

- [x] Description/date save as target
- [x] Comment thread sorted, attributed; post/delete as operator (requires `IMMICH_OPERATOR_API_KEY`)
- [x] Delete asset with confirm dialog
- [x] Albums explore uses same panel
- [x] `npm run lint` && `npm run build`

## Out of scope

- UC-011 remove-from-album implementation
- Tags, location, person DOB

## Sign-off

Operator sign-off **2026-11-03** — [STATUS.md](../use-cases/STATUS.md) UC-003 ✓ (curator panel; comments with operator key via UC-012).
