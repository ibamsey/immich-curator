# IP-2026-11-06: Duplicates view

## Goal

Add a **Duplicates** nav item and page that lists Immich duplicate groups with thumbnails and confirmed delete per asset.

## Files

- `src/lib/immich/types.ts` — `ImmichDuplicateGroup`
- `src/lib/immich/duplicates.ts` — `getDuplicateGroups()`
- `src/app/api/immich/duplicates/route.ts` — proxy `GET /api/duplicates`
- `src/components/duplicates/duplicates-workspace.tsx` — UI
- `src/app/(app)/duplicates/page.tsx` — route
- `src/components/shell/side-nav.tsx` — nav item
- `src/components/config-error.tsx` — optional headings (reuse on other pages)

## Verification

- `npm run lint`
- `npm run build`
- With Immich running: open `/duplicates`, confirm groups load; delete one asset and confirm it disappears (and in Immich).

## Docs

- [US-004](../user-stories/US-004-review-duplicate-photos.md)
- [UC-016](../use-cases/UC-016-browse-and-delete-duplicates.md)
