# US-004: Review suspected duplicate photos

## Narrative

Ian opens immich-curator to see groups of photos Immich flagged as possible duplicates. For each photo in a group, Ian can remove a copy he is sure is redundant after confirming in a dialog.

## Acceptance criteria

- [ ] Main navigation includes **Duplicates**.
- [ ] The Duplicates view lists groups from Immich duplicate detection, each row showing horizontal thumbnails.
- [ ] A delete control on a thumbnail asks for confirmation, then removes that asset via the curator API (no `window.confirm`).
- [ ] Immich API calls remain server-side only ([ADR-0001](../adr/0001-server-side-immich-api.md)).
