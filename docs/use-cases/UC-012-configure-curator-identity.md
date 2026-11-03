# UC-012: Configure curator operator and target

**Primary actor:** Deployment admin (often the same person as the **curator operator**)  
**Supporting actors:** Immich server  
**Channel:** Environment config (v1); [Admin UI](../designs/DES-002-curator-identity-admin.md) (display + non-secret edits when implemented)  
**Preconditions:**

- Admin has access to dartmoor (or host) filesystem for `.env.local`.
- Immich API keys can be created for the **target** user in Immich → Account → API Keys.

## Concepts

| Term | Meaning |
|------|---------|
| **Curator target** | Immich library **owner** the server acts as (`IMMICH_API_KEY`). Albums, assets, people API scope. |
| **Curator operator** | Immich user who **uses the curator** and is the default **album share** collaborator. |

See [ADR-0002](../adr/0002-curator-operator-and-target.md). User-story names (Ian, Geoff) are examples only.

## Main flow — environment (v1)

1. Admin copies `.env.example` → `.env.local` (`chmod 600`).
2. Admin sets `IMMICH_SERVER_URL` (e.g. loopback or LAN URL to Immich).
3. Admin creates an API key for the **target** Immich user; sets `IMMICH_API_KEY`.
4. Admin sets **operator** identity: `CURATOR_OPERATOR_EMAIL` (or `CURATOR_OPERATOR_USER_ID` if supported).
5. Admin optionally sets `CURATOR_DEFAULT_ALBUM_ID` for default Explore scope; optional `CURATOR_DEFAULT_SHARE_ROLE` (e.g. `editor`).
6. Admin starts curator; server validates key, resolves **target** from `/api/users/me`, stores operator default for [UC-009](./UC-009-album-crud-in-curator.md) Share.
7. Admin opens **Admin** in curator ([DES-002](../designs/DES-002-curator-identity-admin.md)) to confirm displayed target/operator match intent.

## Main flow — Admin UI (when built)

1. Operator opens **Admin** (sidebar footer or `/admin`).
2. UI shows **read-only**: Immich URL, **target** user (from live API), connection status.
3. UI shows **operator** email (from config); allows edit if backed by server-side config file or secure server store—not `NEXT_PUBLIC_*`.
4. Operator runs **Test connection**; errors if key invalid or target mismatch when `CURATOR_TARGET_EMAIL` validation is set.
5. Changing **target** requires new `IMMICH_API_KEY` in env and process restart (UI explains; no key entry in browser).

## Alternate flows

- **Target email validation:** Optional `CURATOR_TARGET_EMAIL` must match `/users/me` email after key load; fails fast on wrong key.
- **Operator not on Immich:** Share in UC-009 fails until operator user exists; admin creates user or fixes email.
- **Legacy env:** `POUNDSGATE_ALBUM_ID` accepted as alias for `CURATOR_DEFAULT_ALBUM_ID` until removed in implementation.

## Postconditions

- Curator never relies on hard-coded operator/target in code paths.
- [UC-009](./UC-009-album-crud-in-curator.md) Share pre-fills **operator** as invitee.
- Sidebar/footer shows “Target: …” from resolved profile ([floorplan](../designs/user-interface/floorplan.md)).

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md), [US-002](../user-stories/US-002-split-albums-shared-with-ian.md)  
**Informs:** [DES-002](../designs/DES-002-curator-identity-admin.md), `.env.example`, [ADR-0002](../adr/0002-curator-operator-and-target.md)
