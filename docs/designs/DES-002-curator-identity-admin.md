# DES-002: Curator identity and Admin

**Traces to:** [UC-012](../use-cases/UC-012-configure-curator-identity.md), [ADR-0002](../adr/0002-curator-operator-and-target.md)  
**Status:** Accepted

## Goals

- Configure **curator operator** and **curator target** without hard-coded Immich users.
- **Save operator API key** (and optional fields) via Admin for [UC-003](../use-cases/UC-003-ian-curate-in-shared-album-immich.md) comments.
- Secrets never in browser storage or GET responses ([ADR-0001](../adr/0001-server-side-immich-api.md)).

## Non-goals

- Curator login / multi-tenant admin auth (LAN trust v1).
- Writing secrets into `.env.local` from the browser.
- Client-side `NEXT_PUBLIC_*` keys.

## Configuration sources (precedence: env wins)

| Source | Contents | Admin UI |
|--------|----------|----------|
| `process.env` / `.env.local` | Target key, URL, optional operator key | Read-only when set; badge **Set in environment** |
| `.curator/config.local.json` (gitignored, 600) | Operator key, emails, defaults not in env | Editable when env omits field |
| Immich `/api/users/me` | Live target/operator profile on test | Read-only |

## Admin route

- **Path:** `/admin` — [`AdminSettingsWorkspace`](../../src/components/admin/admin-settings-workspace.tsx)
- **API:** `GET/PUT /api/admin/settings`, `POST /api/admin/test-connection`

### Sections (implemented)

1. Connection overview + test target / operator / both  
2. Immich server URL  
3. Curator target — key (if not env), expected email, profile  
4. Curator operator — email, **operator API key**, resolved id  
5. Optional admin API key (user lookup)  
6. Defaults — album id, share role  
7. Security note (LAN-only)

## Server flow

```
Browser → GET /api/admin/settings → sanitized snapshot (no raw keys)
Browser → PUT /api/admin/settings → merge file → validate keys → reload config
Browser → POST /api/admin/test-connection → /users/me per actor
All Immich routes → loadCuratorConfig() (env ?? file)
```

## Open questions

- Admin auth for non-LAN deployments (future).
