# ADR 0002: Curator operator and target (no hard-coded Immich users)

- **Status:** Accepted
- **Date:** 2026-11-03
- **Deciders:** Operator (deployment admin)
- **Related:** [ADR-0001](./0001-server-side-immich-api.md), [UC-012](../use-cases/UC-012-configure-curator-identity.md)

## Context

immich-curator acts on one Immich user’s library via API key while a **different** person may use the LAN UI and receive **shared album** access. User stories name Ian and Geoff as examples; deployments must support **any** operator/target pair without code changes.

## Decision

1. **Curator target** — The Immich user whose library the server mutates. Identified by `IMMICH_API_KEY` (must belong to target). Display name/email comes from Immich `/api/users/me` at runtime. All album CRUD, tags, people, etc. run as **target**.

2. **Curator operator** — The Immich user who collaborates on shared albums and typically uses the curator UI. Configured explicitly (email or user id). Used as the **default invitee** when sharing albums ([UC-009](../use-cases/UC-009-album-crud-in-curator.md) Share). The operator logs into **Immich** for invitee workflows ([UC-003](../use-cases/UC-003-ian-curate-in-shared-album-immich.md) channel A). For **album activity comments** in the curator RHS panel ([UC-003](../use-cases/UC-003-ian-curate-in-shared-album-immich.md) channel B, [DES-004](../designs/DES-004-asset-curation-panel.md)), the server uses optional **`IMMICH_OPERATOR_API_KEY`** (server-only) so posts are attributed to the operator. All other library mutations (description, dates, delete asset, album CRUD) remain **target** key.

3. **Configuration, not code names**
   - **v1:** Environment variables in `.env.local` (see `.env.example` and [UC-012](../use-cases/UC-012-configure-curator-identity.md)).
   - **Admin file:** Optional gitignored `.curator/config.local.json` (mode 600) for fields not set in env—especially **operator API key** for UC-003. **Env overrides file** when both are set.
   - **Admin UI** ([DES-002](../designs/DES-002-curator-identity-admin.md)): save to file; display target/operator from live API; never return raw keys to the browser.

4. **No hard-coded emails or display names** in application source for operator/target. Docs may use Ian/Geoff only in **user-story narratives**; use cases and designs use **operator** / **target** (or config var names).

5. **Validation:** On startup (or Admin “Test connection”), server verifies target API key, loads target profile, and optionally checks `CURATOR_OPERATOR_EMAIL` resolves to an Immich user via admin/search API when sharing is used. When `IMMICH_OPERATOR_API_KEY` and `CURATOR_OPERATOR_EMAIL` are both set, `/api/users/me` with the operator key must match that email.

## Consequences

### Positive

- Same codebase for other owner/collaborator pairs.
- Share and UI labels reflect configured identities.

### Negative / trade-offs

- Operator and target must both exist on the same Immich instance.
- Misconfigured operator email causes share failures until fixed in Admin/env.
- Curator LAN access is trusted; operator identity is declarative, not a login session (future auth is out of scope).

## References

- [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md), [US-002](../user-stories/US-002-split-albums-shared-with-ian.md) (example personas only)
