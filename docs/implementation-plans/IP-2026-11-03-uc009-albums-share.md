# IP-2026-11-03: UC-009 Albums list and share

**Traces to:** UC-009, UC-012, DES-003, ADR-0001, ADR-0002  
**Status:** Done

## Goal

Albums route: list target albums, RHS metadata, share/update role for configured operator.

## Prerequisites

- `.env.local` with target API key; `CURATOR_OPERATOR_EMAIL` or `CURATOR_OPERATOR_USER_ID`; optional `IMMICH_ADMIN_API_KEY` for email→id lookup.

## Tasks

1. DES-003, STATUS.md, README updates
2. lib/immich albums + users; API routes
3. Albums UI components
4. env share role fields
5. Verify + systemd restart

## Verification

See plan checkboxes in STATUS.md (UC-009 row).

## Out of scope

Create/update/delete album, UC-010, global Explore `?albumId=` (in-album explore from Albums is in scope).

## Sign-off

UC-009 v1 marked complete in [STATUS.md](../use-cases/STATUS.md) (2026-11-03): list, RHS submenu, share/unshare, in-album explore.
