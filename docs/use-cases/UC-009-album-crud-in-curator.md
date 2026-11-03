# UC-009: Album CRUD in immich-curator

**Primary actor:** Curator operator (LAN user)  
**Supporting actors:** Curator target (Immich library owner), Immich server  
**Channel:** immich-curator — **Albums** nav ([floorplan](../designs/user-interface/floorplan.md))  
**Preconditions:**

- [UC-012](./UC-012-configure-curator-identity.md) complete: `IMMICH_API_KEY` for **target**, `CURATOR_OPERATOR_EMAIL` (or id) for **operator** ([ADR-0002](../adr/0002-curator-operator-and-target.md)).
- Operator can open the curator on the LAN.

Curator calls Immich **as target**. Album CRUD is the **target’s** album library. Asset moves between albums remain [UC-010](./UC-010-move-assets-between-albums.md).

## UI entry

1. Operator selects **Albums** in the left nav.
2. **Main canvas** shows all **target-owned** albums from the API (not a hand-maintained ID list).
3. **Header:** **New album** action.
4. **RHS panel:** album metadata, share status, actions (share with operator, edit, open grid, move assets via [UC-010](./UC-010-move-assets-between-albums.md)).

---

## Read — list and open target’s albums

### Main flow

1. Curator loads target’s albums via Immich list/get albums API (server route).
2. Operator sees album cards: cover thumbnail, **title**, **asset count**, badge if **shared with operator** (and role if API exposes it).
3. Operator sorts or filters locally (e.g. title search, “not shared with operator”).
4. Operator clicks an album → canvas shows asset grid ([UC-004](./UC-004-browse-album-assets-in-curator.md)); panel shows album details.

### Alternate flows

- **Empty library:** Only [Create](#create--add-a-new-album) is offered.
- **Album created outside curator:** Appears on next list refresh (Immich UI, import scripts, etc.).

### Postconditions

- Operator has visibility of **all** target albums returned by the API.

---

## Create — add a new album

### Main flow

1. From **Albums**, operator chooses **New album** (header or panel).
2. Operator enters **title** and optional **description**.
3. Curator calls Immich **create album** as **target**.
4. List refreshes; new album appears with zero assets.
5. Operator optionally runs [Share with operator](#share--share-album-with-operator) and [UC-010](./UC-010-move-assets-between-albums.md).

### Postconditions

- Album exists under **target**; target user sees it in Immich **Albums**.

---

## Update — edit album metadata

### Main flow

1. Operator selects an album; panel shows title and description.
2. Operator edits fields and saves.
3. Curator calls Immich **update album** as target.

### Alternate flows

- **v1 defer:** Target edits in Immich UI; curator read + create + share only.

### Postconditions

- Album metadata updated; assets and faces unchanged.

---

## Share — share album with operator

### Main flow

1. Operator selects a target-owned album (shared or not).
2. Operator opens **Share** in the panel (or header).
3. Curator shows current collaborators; pre-fills **operator** from [UC-012](./UC-012-configure-curator-identity.md) (`CURATOR_OPERATOR_EMAIL` / user id lookup).
4. Operator confirms role (default `CURATOR_DEFAULT_SHARE_ROLE`, e.g. editor).
5. Curator calls Immich album **add user / update role** API as **target**.
6. Operator confirms in Immich **Shared with me** ([UC-003](./UC-003-ian-curate-in-shared-album-immich.md)); album card badge updates on refresh.

### Alternate flows

- **Override invitee:** Operator enters a different Immich user for one-off share (still no hard-coded names in code).
- **User not found:** Fix operator email in Admin / `.env.local` ([UC-012](./UC-012-configure-curator-identity.md)).

### Postconditions

- **Operator** has shared access; **target** remains owner ([UC-002](./UC-002-geoff-edit-description-and-name-faces.md) pattern for target-led identification in Immich).

---

## Delete — remove an album (optional v1)

### Main flow

1. Operator selects album; **Delete album** (confirmed).
2. Curator calls Immich **delete album** as target.
3. Album removed from list; **assets remain** in target’s library.

### Postconditions

- Album membership gone; asset metadata unchanged.

---

## Summary (CRUD vs related flows)

| Operation | Curator (Albums) | Related |
|-----------|------------------|---------|
| **Read** | List all target albums; drill into grid | UC-004 |
| **Create** | New album on target account | US-002 |
| **Update** | Title / description | — |
| **Share** | Add **operator** as collaborator | UC-003, UC-012 |
| **Delete** | Drop album only | optional v1 |
| *(membership)* | Move assets between albums | UC-010 |

**Traces to:** [US-002](../user-stories/US-002-split-albums-shared-with-ian.md), [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md)  
**Informs:** [floorplan](../designs/user-interface/floorplan.md), [DES-002](../designs/DES-002-curator-identity-admin.md), [UC-012](./UC-012-configure-curator-identity.md)
