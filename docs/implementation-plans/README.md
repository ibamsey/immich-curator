# Implementation plans

Executable phases for agents and humans. Write **after** relevant ADRs and designs exist (or note explicit waiver in the plan header).

## Template

Create `IP-YYYY-MM-DD-slug.md`:

```markdown
# IP-YYYY-MM-DD: Title

**Traces to:** US-*, UC-*, DES-*, ADR-*  
**Status:** Draft | In progress | Done

## Goal

## Prerequisites

## Tasks

1. …

## Verification

- [ ] …

## Out of scope
```

## Agent workflow

1. Read [docs/README.md](../README.md) chain through ADRs.
2. Pick or create an implementation plan; implement only what the plan lists.
3. Mark plan **Done** when verification passes; link PR/commit if applicable.

## Index

| Plan | Summary | Status |
|------|---------|--------|
| [IP-2026-11-03-app-shell-explore-demo.md](./IP-2026-11-03-app-shell-explore-demo.md) | App shell + Explore demo | Done |
| [IP-2026-11-03-uc009-albums-share.md](./IP-2026-11-03-uc009-albums-share.md) | UC-009 Albums + share | Done |
| [IP-2026-11-03-uc003-asset-curation.md](./IP-2026-11-03-uc003-asset-curation.md) | UC-003 Asset curation panel | Done |
| [IP-2026-11-03-uc012-admin-settings.md](./IP-2026-11-03-uc012-admin-settings.md) | UC-012 Admin settings UI | Done |

Suggested first plan: `IP-*-immich-api-client-and-album-list` after UC for album queue exists.
