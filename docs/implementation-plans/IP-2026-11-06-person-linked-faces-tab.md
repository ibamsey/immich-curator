# IP-2026-11-06: Person RHS linked faces tab + unlink

**Traces to:** UC-014, DES-005, US-003  
**Status:** Done

## Goal

Second RHS tab for a selected person: list Immich-linked faces in shared scope; unlink with confirmation (DELETE to Immich).

## Tasks

1. Docs: US-003 stub, DES-005 + UC-014 touch
2. `listPersonLinkedFacesInSharedAlbums`, `getPersonAssetIdsInSharedAlbums`, `unlinkFaceFromPerson`
3. Routes: `GET /api/immich/people/[personId]/faces`, `DELETE /api/immich/faces/[faceId]`
4. UI: `person-linked-faces-section.tsx`, tabs in `person-context-panel.tsx`; workspace refresh on unlink

## Verification

- [ ] `npm run lint` && `npm run build`
- [ ] Unlink removes face from list and adds to Faces tab unassigned when in scope
