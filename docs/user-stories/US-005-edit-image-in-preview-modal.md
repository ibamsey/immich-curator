# US-005: Basic edits on full-screen preview

## Narrative

As **Ian**, when reviewing a photo in the full-screen preview from Explore or People, I sometimes need **small corrections** (crop, straighten by quarter-turns, brightness, contrast) so the shared catalog looks right without round-tripping through another app.

## Stories

- As **Ian**, I can open **Edit** on a supported raster image in the preview modal and adjust **crop**, **90° rotation**, **brightness**, and **contrast**.
- As **Ian**, I see editing controls **only** for formats we can reliably write back (e.g. JPEG, PNG, WebP).
- As **Ian**, when I press **Save**, I must **confirm** that the **library original will be replaced** (the server replaces the asset via Immich’s upload + copy + delete flow; the **asset id changes**).
- As **Ian**, I can **revert** my local adjustments before saving.

## Acceptance criteria

- [ ] Edit mode is optional; normal zoom/pan preview remains when not editing.
- [ ] Unsupported formats show **no** edit affordance (or a short note that editing is unavailable).
- [ ] Save uses an in-app confirmation dialog (no `window.confirm`), with clear copy about replacing the file and id change.
- [ ] Revert restores the unsaved preview to match the loaded original.
- [ ] After a successful save, the app **selects** the new asset id where applicable (Explore grid / detail).

## Notes

- Immich no longer exposes in-place replace; see [IP-2026-11-06-preview-modal-image-editing](../implementation-plans/IP-2026-11-06-preview-modal-image-editing.md).
- Structured behaviour: [UC-018](../use-cases/UC-018-edit-image-in-preview-modal.md).
