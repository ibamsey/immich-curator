# ADR-0004: Computed asset metadata fields

- **Status:** Accepted
- **Date:** 2026-11-04
- **Deciders:** Ian, Curator agents

## Context

Curator displays Immich asset metadata in the RHS curation panel and uses a **field registry** for grid sort/filter/group ([DES-006](../designs/DES-006-asset-grid-query-bar.md)). Immich `exifInfo` exposes **pixel** width/height but not **XResolution/YResolution** on dartmoor, so physical print size (mm) cannot be read directly from the API. Scanner imports ([UC-001](../use-cases/UC-001-ingest-scanned-photos-poundsgate.md)) typically embed DPI in files even when Immich does not surface it.

Ian needs **physical width × height (mm)** and **area (mm²)** as derived values, with room for more computed fields later, without writing derived data back to Immich.

## Decision

1. **Computed field registry** — [`computed-field-registry.ts`](../../src/lib/assets/computed-field-registry.ts) holds pure `compute(asset, context)` functions and display formatters. Values are **never persisted**.
2. **Stored vs computed in grid UX** — [`asset-field-registry.ts`](../../src/lib/assets/asset-field-registry.ts) registers computed field ids with `clientOnly: true` for sort/filter/group; [`grid-field-value.ts`](../../src/lib/assets/grid-field-value.ts) delegates to the computed registry.
3. **Physical size math** — [`physical-size.ts`](../../src/lib/assets/physical-size.ts): pixels + effective DPI → mm; area = width × height mm.
4. **DPI sources (hybrid)** — (a) optional server read of file EXIF via `exiftool` when `IMMICH_LIBRARY_ROOT` is configured; (b) fallback **`scanDefaultDpi`** (default 600) from Admin/env. Grid/list queries use **fallback only** (no per-row exiftool). Asset detail GET may attach `curatorEnrichment.resolution` after file read.
5. **UI** — [`AssetMetadataFields`](../../src/components/assets/asset-metadata-fields.tsx) renders stored + computed rows anywhere read-only metadata is shown (v1: curation panel, optional People list line).

## Consequences

### Positive

- Single place to add future computed fields (aspect ratio bands, etc.).
- Grid can sort/group/filter by area client-side after Immich search.
- Detail view can show accurate DPI when library mount and exiftool are available.

### Negative / trade-offs

- Grid physical sizes may use **assumed DPI** until the user opens asset detail (then enrichment may differ slightly).
- Requires **exiftool** on the host and read access to Immich library files for file-based DPI.
- Computed filters/sorts apply only to the **current result page** (same as other client-only UC-015 rules).

## References

- [DES-004](../designs/DES-004-asset-curation-panel.md), [DES-006](../designs/DES-006-asset-grid-query-bar.md)
- [IP-2026-11-04-computed-physical-size](../implementation-plans/IP-2026-11-04-computed-physical-size.md)
- Immich `ExifResponseDto` (pixel fields only in API)
