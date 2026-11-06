# IP-2026-11-06: Duplicates tab — merge selection and face move/unlink

**Traces to:** UC-014 (People workspace)  
**Status:** Done

## Goal

On the **People → Duplicates** tab (similar names): allow ordered multi-select of person columns with merge into the first selected person; confirm dialog shows merge direction; per-face unlink and drag-and-drop reassignment between people in the same row.

## Files

- `src/components/people/duplicates-name-catalog.tsx` — selection UI, merge + unlink + DnD; delete person when last linked face removed
- `src/components/people/people-workspace.tsx` — pass `onPersonMerged` / `onPersonUpdated` / `onPersonDeleted` / `onFaceUnlinkedFromPerson`
- `src/lib/immich/people.ts` — `deletePerson` (Immich `DELETE /api/people/:id`)
- `src/app/api/immich/people/[personId]/route.ts` — `DELETE` proxy
- `src/components/ui/confirm-dialog.tsx` — optional `children` for rich merge summary

## Verification

- `npm run lint`
- `npm run build`
- Manual: select two+ people in order, Merge → dialog shows survivor + sources; confirm → list updates. Unlink removes a thumb. Drag face between columns in same row → face moves.

## Out of scope

- Dragging faces across different similarity rows (sections)
- Reordering merge priority without deselecting (future: drag-to-reorder)
