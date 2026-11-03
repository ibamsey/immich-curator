# ADR 0001: Server-side Immich API with target user’s API key

- **Status:** Accepted
- **Date:** 2026-11-03
- **Deciders:** Ian (operator), product intent Poundsgate sidecar

## Context

immich-curator must edit **curator target** assets (description, tags, location, people) without Immich multi-user sharing migration. Browser clients must not hold the target’s API key. Immich permissions are tied to the key owner ([ADR-0002](./0002-curator-operator-and-target.md): configurable target, not hard-coded in code).

## Decision

1. All Immich HTTP calls run **only** in Next.js server code (Route Handlers, Server Actions, server modules).
2. Configure `IMMICH_SERVER_URL` and `IMMICH_API_KEY` (target user) in `.env.local`, never `NEXT_PUBLIC_*`.
3. Optional default album scope: `CURATOR_DEFAULT_ALBUM_ID` ([UC-012](../use-cases/UC-012-configure-curator-identity.md)).
4. App hosted LAN-only on dartmoor; firewall/reverse proxy is an ops concern outside this repo.

## Consequences

### Positive

- Operator gets owner-equivalent catalog APIs on the target’s assets via server proxy.
- No cluster groups or person-sharing migration required for Ian’s metadata edits.

### Negative / trade-offs

- Curator actions appear as **target** in Immich audit semantics.
- Other Immich users’ libraries are out of scope unless deployment changes target key ([ADR-0002](./0002-curator-operator-and-target.md)).
- Sidecar must proxy thumbnails/originals; CORS avoided by same-origin app.

## References

- [US-001](../user-stories/US-001-geoff-knows-ian-catalogs.md)
- [Immich API](https://docs.immich.app)
- [`../immich/docs/immich-curation-app.md`](../../immich/docs/immich-curation-app.md)
