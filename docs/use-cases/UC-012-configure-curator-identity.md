# UC-012: Configure curator operator and target

**Primary actor:** Deployment admin (often the same person as the **curator operator**)  
**Supporting actors:** Immich server  
**Channel:** `.env.local`, **Admin UI** (`/admin`), gitignored [`.curator/config.local.json`](../../.curator/config.local.example.json)  
**Preconditions:**

- Admin has LAN access to the curator host.
- Immich API keys can be created in Immich → Account → API Keys.

## Concepts

| Term | Meaning |
|------|---------|
| **Curator target** | Immich library **owner** the server acts as (`IMMICH_API_KEY`). Albums, assets, metadata delete. |
| **Curator operator** | Default album share invitee; **UC-003** comments use `IMMICH_OPERATOR_API_KEY` (env or Admin file). |

See [ADR-0002](../adr/0002-curator-operator-and-target.md).

## Configuration precedence

**Environment variables override** Admin-saved file. Typical dartmoor setup: target key in `.env.local`; operator key added via **Admin** for [UC-003](./UC-003-ian-curate-in-shared-album-immich.md) comment testing.

## Main flow — environment

1. Copy `.env.example` → `.env.local` (`chmod 600`).
2. Set `IMMICH_SERVER_URL`, `IMMICH_API_KEY` (target), `CURATOR_OPERATOR_EMAIL`.
3. Optional: `IMMICH_OPERATOR_API_KEY`, `IMMICH_ADMIN_API_KEY`, defaults.

## Main flow — Admin UI

1. Open **Admin** (sidebar footer → `/admin`).
2. Review **Connection overview**; **Test target** / **Test operator**.
3. Enter **operator email** and **operator API key** (when not set in env); **Save settings**.
4. Keys persist to `.curator/config.local.json` (mode 600); effective **without process restart**.
5. Fields managed in env show **Set in environment** and are read-only in Admin.
6. Use **Explore** → UC-003 comments with operator attribution.

## Alternate flows

- **Target key:** Usually env-only; Admin shows “Managed in environment”.
- **Email mismatch on save:** PUT validates `/users/me` against expected operator/target email.
- **Operator not on Immich:** Fix email or create Immich user before share/comment.

## Postconditions

- No hard-coded operator/target in code.
- [UC-009](./UC-009-album-crud-in-curator.md) Share uses operator identity.
- GET `/api/admin/settings` never returns raw API keys.

**Traces to:** [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md), [US-002](../user-stories/US-002-split-albums-shared-with-ian.md)  
**Informs:** [DES-002](../designs/DES-002-curator-identity-admin.md), [ADR-0002](../adr/0002-curator-operator-and-target.md)
