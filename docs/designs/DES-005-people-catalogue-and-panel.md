# DES-005: People catalogue and RHS asset panel

**Traces to:** UC-014, UC-008, [floorplan](./user-interface/floorplan.md)  
**Status:** Accepted

## Goals

- **People** route replaces stub: shared-album-scoped person catalogue with inline identity fields.
- RHS panel: per-person asset grid (thumbnail + description); double-click handoff to Explore.
- All Immich calls as **target** ([ADR-0001](../adr/0001-server-side-immich-api.md)).

## Non-goals (v1)

- Face merge/split, reassign faces, hidden-people toggle.
- Separate first/last name (Immich single `name` only).
- Per-album People filter (union of all operator-shared albums).

## Layout

| Region | Content |
|--------|---------|
| Main canvas | Two tabs. **People:** named persons only. **Faces:** unnamed cluster persons, then detections that have no person. Named tiles use **PersonIdentityEditor** (face thumb, name, DOB `dd/mm/yyyy`). Detection tiles are a square crop of the source photo plus a name field. |
| RHS panel | A selected person: **Photos** tab — asset grid (single-click select); below grid: **face wheel** or sole **PersonIdentityEditor**. **Linked faces** tab — all faces Immich links to this person (target library), plus **unassigned** faces on scanned assets where Immich’s people similarity list for that face includes this person; **similarity** is the 1-based rank from `GET /api/people?closestAssetId=<faceId>` (lower = closer). Link / unlink with confirm. A selected detection: that one photo and a name field. Double-click a photo → Explore. |

Giving a person or a detection a name moves that record onto **People** and selects it. Clearing a name moves the person back to **Faces**. Naming a detection creates one person for that face. Similar detections stay on **Faces** until Immich clusters them. A name that matches an existing person offers the same merge check as the person editor; merging assigns the face to that person instead of creating another.

Interaction matches Albums/Explore: selection opens panel; Esc/backdrop closes panel per shell.

## Server / data flow

```mermaid
sequenceDiagram
  participant UI as PeopleWorkspace
  participant API as RouteHandlers
  participant Lib as shared-album-scope
  participant Immich as Immich target key

  UI->>API: GET /api/immich/people?scope=shared
  API->>Lib: shared album IDs + asset set
  API->>Immich: GET /api/people
  loop each person candidate
    API->>Immich: POST /api/search/metadata personIds albumIds size=1
  end
  API-->>UI: filtered people list

  UI->>API: GET /api/immich/faces/unassigned
  API->>Lib: all assets in shared albums
  API->>Immich: GET /api/faces per asset
  API-->>UI: faces whose person is null

  UI->>API: GET /api/immich/people/id/assets
  API->>Immich: POST /api/search/metadata personIds albumIds
  API-->>UI: assets with description

  UI->>API: GET /api/immich/people/id/faces
  API->>Immich: metadata (person assets + library slice) + GET /api/faces per asset + GET /api/people?closestAssetId= per unassigned candidate
  API-->>UI: linked faces + similar unassigned (ranked)

  UI->>API: PUT /api/immich/people/id
  API->>Immich: PUT /api/people/id
```

### Scope filter (v1)

1. `getSharedAlbumIds(operatorUserId)` from target album list ([UC-009](./../use-cases/UC-009-album-crud-in-curator.md) share semantics).
2. For each person from paginated `GET /api/people` (skip `isHidden`), include if `POST /api/search/metadata` with `{ personIds: [id], albumIds: sharedIds, size: 1 }` returns `assets.total > 0`.
3. Person assets for panel: same search with larger page size (500 cap per album scope; paginate if needed later).

### Thumbnails

- Person face: `GET /api/immich/people/{id}/thumbnail` → proxy Immich person thumbnail.
- Unassigned detection: asset thumbnail, cropped to the face box.
- Assets: existing asset thumbnail proxy.

### Explore handoff

- Navigate to `/explore?assetId={id}&albumId={resolved}`.
- `resolveExploreForAsset` picks shared album containing asset (prefer default album when valid).

## Face wheel (panel, selected photo)

After **single-click** on an asset, `GET /api/immich/assets/{id}` supplies `people[]`.

| Case | UI |
|------|-----|
| One face (or only context person) | `PersonIdentityEditor` only |
| Context + other faces | SVG **FaceWheelSvg**: context at hub; other faces on rotatable spokes with top focus gap; scroll wheel rotates; click snaps spoke to top; editor below tracks top spoke after engage |

- **Double-click** spoke → change main catalogue selection (`onSwitchContextPerson`) and open the tab that holds that person.
- The wheel lists people on the photo. It does not list detections that have no person.
- Layout math: [`face-wheel-layout.ts`](../../src/lib/people/face-wheel-layout.ts).

## Client components

| Component | Role |
|-----------|------|
| `people-workspace.tsx` | Shell, People/Faces tabs, selection, move-on-name |
| `person-identity-editor.tsx` | Shared name/DOB Save (catalog + panel) |
| `person-catalog-grid.tsx` | Named and cluster tiles |
| `faces-catalog.tsx` | Faces tab: clusters, then unidentified detections |
| `detection-name-field.tsx` | Name a detection; merge check before create |
| `detection-context-panel.tsx` | One photo and a name field |
| `person-context-panel.tsx` | Panel tabs (photos / linked faces) + asset selection |
| `person-linked-faces-section.tsx` | Linked face grid; DELETE unlink via confirm |
| `person-asset-grid.tsx` | Single-click select; double-click → Explore |
| `asset-faces-section.tsx` | Fetch asset people; wheel vs sole editor |
| `face-wheel-svg.tsx` | Hub-and-spoke SVG widget |

## Open questions

- Catalogue size > ~50 persons: batch or cache scope filter (acceptable for Poundsgate v1).
