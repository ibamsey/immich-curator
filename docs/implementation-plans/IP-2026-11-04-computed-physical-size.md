# IP-2026-11-04: Computed physical size

**Traces to:** ADR-0004, DES-004, DES-006, UC-004, UC-015  
**Status:** Done

## Goal

Physical print size (mm) and area (mm²) from pixel metadata + hybrid DPI; computed field registry; grid group/sort/filter; shared metadata UI.

## Tasks

1. ADR-0004 + DES-004/006 updates
2. `physical-size.ts`, `computed-field-registry.ts`, grid wiring
3. Config: `scanDefaultDpi`, `immichLibraryRoot`, Admin, curator-config API
4. `read-image-resolution.ts`, enrich GET asset
5. `AssetMetadataFields`, curation panel, person list line
6. Tests, lint, build

## Verification

- [x] Curation panel: pixels + physical mm + area + DPI note
- [x] Grid group/sort/filter by `physicalAreaMm2`
- [x] Default DPI when file EXIF unavailable
- [x] `npm run lint && npm run build && npm test`
