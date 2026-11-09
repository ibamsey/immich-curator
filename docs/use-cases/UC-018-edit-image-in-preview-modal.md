# UC-018: Edit raster image in full-screen preview

**Primary actor:** Ian  
**Supporting actors:** Immich API (target key)  
**Channel:** immich-curator — [`AssetPreviewModal`](../components/grid/asset-preview-modal.tsx) from **Explore**, **Albums** in-album view, or **People** (photo list / linked faces)  
**Preconditions:**

- Ian opened the zoom/pan preview for a **single** asset ([UC-004](./UC-004-browse-album-assets-in-curator.md)).
- Asset is a supported **raster** format (e.g. JPEG, PNG, WebP); curator probes original `Content-Type` before offering edit.
- Server-side target API key configured ([UC-012](./UC-012-configure-curator-identity.md)).

## Main flow

1. Ian clicks **Edit** in the preview modal.
2. Curator enters edit mode: pan/zoom disabled; **crop** rectangle (`EditImageCrop`), **90° rotation**, **brightness**, and **contrast** controls shown.
3. Ian adjusts parameters; preview updates locally (Canvas 2D pipeline).
4. Ian chooses **Save**; curator shows a confirmation that the **library original will be replaced** and that Immich may issue a **new asset id** (upload + copy + delete flow).
5. On confirm, curator posts the edited bytes via server route → Immich; parent grids/panels receive `onAssetReplaced` and refetch or remap selection to the new id where applicable.

## Alternate flows

- **Revert:** Ian discards local edit state and returns to the last loaded original in the modal.
- **Unsupported format:** Edit affordance hidden or disabled with short explanation.
- **Edit + faces:** While not in image-edit mode, face overlays and naming remain available ([UC-019](./UC-019-adjust-faces-in-preview.md)); entering image edit may gate face interaction per design.
- **Cancel edit mode:** Ian exits edit without saving; no Immich write.

## Postconditions

- On successful save, Geoff’s library holds the edited file (new asset id per Immich replace semantics).
- Explore / People selection and open previews track the new id when parents wire `onAssetReplaced`.

**Traces to:** [US-005](../user-stories/US-005-edit-image-in-preview-modal.md)  
**Informs:** [IP-2026-11-06-preview-modal-image-editing](../implementation-plans/IP-2026-11-06-preview-modal-image-editing.md), DES-004
