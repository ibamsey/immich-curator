# immich-curator documentation

Documentation for the LAN sidecar that curates a configured **curator target** library via the Immich API (target API key server-side only; **operator** and **target** per [ADR-0002](./adr/0002-curator-operator-and-target.md)).

## Agentic workflow (read in this order)

When planning or implementing features, follow the chain below. **Do not skip ahead** to code without the preceding artifact unless the user explicitly waives it.

| Step | Folder | Purpose |
|------|--------|---------|
| 1 | [user-stories](./user-stories/) | Who wants what and why (narrative, acceptance in plain language) |
| 2 | [use-cases](./use-cases/) | Actors, flows, pre/postconditions (structured behaviour) |
| 3 | [designs](./designs/) | UX, API boundaries, data flow, component sketches |
| 4 | [adr](./adr/) | Architecture Decision Records (durable “why we chose X”) |
| 5 | [implementation-plans](./implementation-plans/) | Phased tasks, files, verification checks before merge |

Later steps may reference earlier ones by ID (e.g. `US-001`, `UC-003`, `ADR-0002`, `IP-2026-11-03-album-queue`).

## Naming conventions

| Type | Pattern | Example |
|------|---------|---------|
| User story | `US-NNN-short-slug.md` | `US-001-ian-edit-description.md` |
| Use case | `UC-NNN-short-slug.md` | `UC-001-browse-album-queue.md` |
| Design | `DES-NNN-short-slug.md` or topic folder | `DES-001-album-queue-ui.md` |
| ADR | `NNNN-title-with-dashes.md` | `0001-server-side-immich-api.md` |
| Implementation plan | `IP-YYYY-MM-DD-slug.md` | `IP-2026-11-03-scaffold-api-client.md` |

Use lowercase slugs with hyphens. Keep one primary topic per file.

## Related repositories

| Path | Role |
|------|------|
| [`../immich`](../immich) | Immich server ops, import scripts, `.env` API keys |
| [`../immich/docs/immich-curation-app.md`](../immich/docs/immich-curation-app.md) | Deployment context on dartmoor |

External: [Immich API](https://docs.immich.app)

## Status

User stories US-001–US-004 and use cases UC-001–UC-016 drafted; UC-003/009/012 signed off; UC-014 People in progress.
