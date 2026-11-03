# US-002: Split a growing collection into new shared albums

## Narrative

Poundsgate holds 500+ scans. Ian creates **`Poundsgate · Buildings`** on Geoff’s account, moves barn and house photos out of the main Poundsgate album, shares the new album with Ian (Editor or Viewer per policy). Geoff opens either album in Immich and names faces as usual. Sally’s wedding photos stay in Poundsgate or move to **`Poundsgate · Events`**—descriptions, tags, locations, and **people names stay on the assets**.

## Stories

Deconstruction of the narrative above.

**Ian (structure)**  
As **Ian**, I see that the single **Poundsgate** album is no longer enough as the scanned collection grows, so I **create a new album** on **Geoff’s account** and **move appropriate images** from Poundsgate into it (same library, clearer grouping).

**Ian (Geoff visibility and sharing)**  
As **Ian**, I use **immich-curator** (Geoff’s API key—I act as Geoff) to **set up the new album** so **Geoff sees it** in his Immich library and the album is **shared with Ian** the same way as Poundsgate (collaboration album, not private to Ian).

**Geoff (unchanged identification workflow)**  
As **Geoff**, I continue to **edit descriptions** and **name faces** on photos in **any** shared Poundsgate-family album Ian has organised, without re-identifying people when images move between albums.

**Ian (Immich + sidecar)**  
As **Ian**, I may **administer album layout** (create album, move assets between albums, share with Ian) in the **curator**; I still use **Immich** (shared albums) for Geoff-led identification and other in-app curation from US-001.

## Acceptance criteria

- [ ] Ian can **create** a new album on Geoff’s account via sidecar (Geoff API key).
- [ ] Ian can **add** assets to the new album and **remove** them from Poundsgate (or another source album) without **deleting** assets from Geoff’s library.
- [ ] After a move, **metadata persists**: description, tags, dates, map location, and other asset fields unchanged.
- [ ] After a move, **people / face assignments persist**: Geoff’s named people remain linked to the asset; Explore → People and face labels in the viewer are unchanged (faces are per asset, not per album).
- [ ] Ian can configure **album sharing** so Ian’s Immich login has access to the new album (parity with Poundsgate: shared with Ian, visible to Geoff as owner).
- [ ] Geoff sees the new album in Immich without manual account tricks (album owned by Geoff).
- [ ] Sidecar **lists all target albums** in Albums ([UC-009](../use-cases/UC-009-album-crud-in-curator.md)); **operator** and **target** configured via [UC-012](../use-cases/UC-012-configure-curator-identity.md) / [ADR-0002](../adr/0002-curator-operator-and-target.md) (no hard-coded Immich users in code).
- [ ] `IMMICH_API_KEY` remains server-side only.

## Notes

- In Immich, albums are **views** over the same Geoff-owned assets; moving between albums updates **album membership** only, not ownership or face/person records.
- **Nested albums** are not supported in Immich; use **sibling albums** and naming (e.g. `Poundsgate · …`) per US-001 / ops docs.
- Use cases should define: share role for Ian on new albums, and which album-admin actions are **curator-only** vs also available in Immich UI.

## Traceability

- Related: [US-001](./US-001-geoff-knows-ian-catalogs.md)
- Use cases: [UC-009](../use-cases/UC-009-album-crud-in-curator.md), [UC-010](../use-cases/UC-010-move-assets-between-albums.md), [UC-012](../use-cases/UC-012-configure-curator-identity.md); [UC-002](../use-cases/UC-002-geoff-edit-description-and-name-faces.md)
- Design: (to be written) `DES-*` — multi-album config in curator
- ADR: [0001](../adr/0001-server-side-immich-api.md), [0002](../adr/0002-curator-operator-and-target.md); design: [DES-002](../designs/DES-002-curator-identity-admin.md)
