# ADR 0002: Curator operator and target (no hard-coded Immich users)

- **Status:** Accepted
- **Date:** 2026-11-03
- **Deciders:** Operator (deployment admin)
- **Related:** [ADR-0001](./0001-server-side-immich-api.md), [UC-012](../use-cases/UC-012-configure-curator-identity.md)

## Context

immich-curator acts on one Immich user’s library via API key while a **different** person may use the LAN UI and receive **shared album** access. User stories name Ian and Geoff as examples; deployments must support **any** operator/target pair without code changes.

## Decision

1. **Curator target** — The Immich user whose library the server mutates. Identified by `IMMICH_API_KEY` (must belong to target). Display name/email comes from Immich `/api/users/me` at runtime. All album CRUD, tags, people, etc. run as **target**.

2. **Curator operator** — The Immich user who collaborates on shared albums and typically uses the curator UI. Configured explicitly (email or user id). Used as the **default invitee** when sharing albums ([UC-009](../use-cases/UC-009-album-crud-in-curator.md) Share). The operator logs into **Immich** with their own account for invitee workflows ([UC-003](../use-cases/UC-003-ian-curate-in-shared-album-immich.md)); the curator app does not impersonate the operator on the API.

3. **Configuration, not code names**
   - **v1:** Environment variables in `.env.local` (see `.env.example` and [UC-012](../use-cases/UC-012-configure-curator-identity.md)).
   - **Later:** Admin UI ([DES-002](../designs/DES-002-curator-identity-admin.md)) may edit non-secret fields and display target from live API; **API key rotation** remains env/file outside the browser.

4. **No hard-coded emails or display names** in application source for operator/target. Docs may use Ian/Geoff only in **user-story narratives**; use cases and designs use **operator** / **target** (or config var names).

5. **Validation:** On startup (or Admin “Test connection”), server verifies API key, loads target profile, and optionally checks `CURATOR_OPERATOR_EMAIL` resolves to an Immich user via admin/search API when sharing is used.

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
