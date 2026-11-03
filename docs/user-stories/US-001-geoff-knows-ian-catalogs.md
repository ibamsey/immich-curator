# US-001: Scan, identify, and curate Poundsgate photos

## Narrative (Sally’s wedding)

1. Ian scans a print and uploads it into Poundsgate (Geoff-owned assets).
2. Geoff opens the shared album in Immich, writes description (e.g. Sally’s wedding at Leusdon), names Sally, Bill, Mary on faces.
3. Ian sees event and place in the description, adds tag `Sally's Wedding` and map pin Leusdon (Immich and/or sidecar as Geoff).
4. Geoff mistypes “Leusdon” in the description; Ian fixes it via sidecar acting as Geoff.
5. Geoff sets Mary’s DOB wrong; Ian corrects the person record (Immich and/or sidecar as Geoff).

## Stories

Deconstruction of the narrative above.

**Ian (ingest)**  
As **Ian**, I upload images by scanning **Geoff’s box of old photos** into Immich (Poundsgate), so the collection is digitised and available for curation.

**Geoff (identification in Immich)**  
As **Geoff**, I know what each image is about and who is in it, so I **edit the image description** and **add names to faces** on my Poundsgate photos (album shared with Ian for collaboration).

**Ian (structure after Geoff’s description)**  
As **Ian**, I read what Geoff wrote in the description (event, place, context), so I can **create tags** and **set map locations** that match Geoff’s identification.

**Ian (corrections)**  
As **Ian**, I sometimes fix a **typo in the description** Geoff entered, or correct a **person’s date of birth** Geoff set, so the catalog stays accurate without Geoff redoing work.

**Ian (two tools)**  
As **Ian**, I use **Immich** (Geoff has **shared the Poundsgate album** with me) for curation tasks that work well in the native app, and I use **immich-curator** (Geoff’s API key—I **act as Geoff** on the server) for other curation tasks the shared album UI does not support well.

## Acceptance criteria

- [ ] Ian can ingest scans into Geoff’s Poundsgate corpus (existing import path on dartmoor).
- [ ] Geoff can edit **asset description** and **people / face names** on Geoff-owned photos (Geoff login; shared album access).
- [ ] Ian can use **shared album** in Immich for agreed in-app curation (scope defined in use cases).
- [ ] Ian can use **immich-curator** with Geoff’s API key (server-side only) to: tags, locations, description fixes, DOB fixes, and other sidecar use cases.
- [ ] Roles are clear in docs: which tasks are **Immich UI (Ian as invitee)** vs **sidecar (Ian as Geoff via API)**.
- [ ] `IMMICH_API_KEY` never exposed to the browser (`NEXT_PUBLIC_*`).
- [ ] **Curator operator** and **curator target** are configurable ([UC-012](../use-cases/UC-012-configure-curator-identity.md), [ADR-0002](../adr/0002-curator-operator-and-target.md))—not hard-coded in application code.

## Notes

- Asset **ownership** remains **Geoff** for Poundsgate; Ian’s sidecar calls use Geoff’s key (same as [ADR-0001](../adr/0001-server-side-immich-api.md)).
- Immich permission limits still apply in the **shared album UI** (e.g. Ian may not get all owner fields as album Editor/Viewer—gaps drive sidecar-as-Geoff tasks).

## Traceability

- Related: [US-002](./US-002-split-albums-shared-with-ian.md) (album split as collection grows)
- Use cases: [UC-001](../use-cases/UC-001-ingest-scanned-photos-poundsgate.md)–[UC-008](../use-cases/UC-008-ian-correct-person-date-of-birth.md), [UC-013](../use-cases/UC-013-select-curation-channel.md) (channel guide)
- Design: (to be written) `DES-*`
- ADR: [0001](../adr/0001-server-side-immich-api.md), [0002](../adr/0002-curator-operator-and-target.md) (operator/target config)
