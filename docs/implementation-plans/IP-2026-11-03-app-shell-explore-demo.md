# IP-2026-11-03: App shell and Explore demo

**Traces to:** UC-004, DES-001, ADR-0001, ADR-0003, floorplan  
**Status:** Done

## Goal

Basic curator framework: shell, Lightroom dark theme, Immich server client, `/explore` showing default album grid with RHS asset detail on select.

## Prerequisites

- Immich running; `.env.local` with `IMMICH_API_KEY`, `IMMICH_SERVER_URL`, default album id.

## Tasks

1. Docs: DES-001, theme-lightroom.md
2. `lib/config/env.ts`, `lib/immich/*`
3. Route Handlers under `/api/immich/*`
4. Shell + Explore components and routes
5. lint + build

## Verification

- [ ] `/explore` shows album thumbnails
- [ ] Select asset → RHS detail panel
- [ ] No API key in browser network
- [ ] `npm run lint` && `npm run build`

## Out of scope

Edit metadata, People/Locations/Albums data, Admin UI, pagination polish.
