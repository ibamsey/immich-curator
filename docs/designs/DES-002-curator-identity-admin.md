# DES-002: Curator identity and Admin

**Traces to:** [UC-012](../use-cases/UC-012-configure-curator-identity.md), [ADR-0002](../adr/0002-curator-operator-and-target.md)  
**Status:** Draft

## Goals

- Configure **curator operator** and **curator target** without hard-coded Immich users.
- Give deployment admin a single place to **verify** identity and connection.
- Keep **API keys** out of the browser ([ADR-0001](../adr/0001-server-side-immich-api.md)).

## Non-goals

- Curator login / multi-tenant operators (LAN trust for v1).
- Storing `IMMICH_API_KEY` in Admin UI or client storage.
- Switching target at runtime without restart.

## Configuration sources (priority)

| Source | Contents | Editable in Admin UI |
|--------|----------|----------------------|
| `.env.local` | `IMMICH_SERVER_URL`, `IMMICH_API_KEY`, operator email/id, optional defaults | No (key); show read-only + doc link |
| Server config file (optional, gitignored) | Non-secret overrides, operator email | Yes, if implemented |
| Immich `/api/users/me` | Target display name, email, id | Read-only display |

## Admin route

- **Path:** `/admin` (linked from sidebar **footer**, not primary curation nav).
- **Layout:** Same app shell as [floorplan](./user-interface/floorplan.md); main canvas = settings cards; optional RHS panel for help text.

### Sections

1. **Connection**
   - Immich server URL (masked if sensitive query params).
   - Status: OK / unreachable / invalid key.
   - Button: **Test connection** → server route hits Immich health + `/users/me`.

2. **Curator target**
   - Label: “Library owner (API acts as this user)”.
   - Fields: email, name, user id (from API).
   - Note: change via new API key in `.env.local` + restart.

3. **Curator operator**
   - Label: “Collaborator (default album share invitee)”.
   - Field: email (and optional user id).
   - v1: read from env; save → write server config or instruct restart with updated env.
   - Link: [UC-003](../use-cases/UC-003-ian-curate-in-shared-album-immich.md) (operator uses Immich as this user).

4. **Defaults**
   - Default album id for Explore scope (`CURATOR_DEFAULT_ALBUM_ID`).
   - Default share role (`CURATOR_DEFAULT_SHARE_ROLE`).

5. **Security note**
   - Curator is LAN-only; restrict network access; do not expose Admin on the public internet without auth.

## UI copy (examples, not fixed names)

- Sidebar footer: `Target: {targetEmail}` · [Admin]
- Album share panel: “Share with operator ({operatorEmail})”
- Empty state if operator unset: “Set CURATOR_OPERATOR_EMAIL in Admin / `.env.local`”

## Server / data flow

```
Browser → GET /api/admin/identity (no secrets)
       ← { serverUrl, target: UserDto, operatorEmail, defaults, connectionOk }

Browser → POST /api/admin/test-connection
       ← { ok, targetEmail?, error? }
```

Implementation may merge identity into a single bootstrap endpoint used by the shell layout.

## Open questions

- Persist operator email in gitignored `curator.config.json` vs env-only v1?
- Require operator Immich user lookup on startup (warn if missing)?
