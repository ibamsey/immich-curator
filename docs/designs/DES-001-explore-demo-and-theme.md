# DES-001: Explore demo and theme

**Traces to:** UC-004, [floorplan](./user-interface/floorplan.md), IP-2026-11-03  
**Status:** Accepted for demo

## Goals

- Demonstrate end-to-end read path: default album → grid → asset detail in RHS panel.
- Apply Lightroom-inspired dark token theme ([theme-lightroom.md](./user-interface/theme-lightroom.md)).

## Non-goals

- Metadata editing, filters, pagination UI, non-Explore routes (stubs only).

## Explore demo

| Element | Behaviour |
|---------|-----------|
| Data source | `CURATOR_DEFAULT_ALBUM_ID` or `POUNDSGATE_ALBUM_ID` |
| Grid | Thumbnails via same-origin `/api/immich/assets/{id}/thumbnail` |
| Selection | Single select; blue accent ring |
| Panel | Refetch `GET /api/immich/assets/{id}` on select; show preview, filename, dates, description, tags |

## Server / data flow

RSC loads album + assets via `lib/immich`; client handles selection and panel fetch.
