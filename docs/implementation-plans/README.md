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
| [IP-2026-11-04-explore-grid-face-boxes.md](./IP-2026-11-04-explore-grid-face-boxes.md) | Face rectangles on the Explore grid | Done |
| [IP-2026-11-03-uc009-albums-share.md](./IP-2026-11-03-uc009-albums-share.md) | UC-009 Albums + share | Done |
| [IP-2026-11-03-uc003-asset-curation.md](./IP-2026-11-03-uc003-asset-curation.md) | UC-003 Asset curation panel | Done |
| [IP-2026-11-03-uc012-admin-settings.md](./IP-2026-11-03-uc012-admin-settings.md) | UC-012 Admin settings UI | Done |
| [IP-2026-11-04-uc014-people-workspace.md](./IP-2026-11-04-uc014-people-workspace.md) | UC-014 People workspace | Done |
| [IP-2026-11-04-uc015-asset-grid-query.md](./IP-2026-11-04-uc015-asset-grid-query.md) | UC-015 Grid query bar | Done |
| [IP-2026-11-04-computed-physical-size.md](./IP-2026-11-04-computed-physical-size.md) | Computed physical size (ADR-0004) | Done |
| [IP-2026-11-04-uc005-tags.md](./IP-2026-11-04-uc005-tags.md) | UC-005 tag editor as the target | Done |
| [IP-2026-11-06-duplicates-merge-and-face-dnd.md](./IP-2026-11-06-duplicates-merge-and-face-dnd.md) | Duplicates tab: merge selection + face unlink/DnD | Done |
| [IP-2026-11-06-cache-components-navigation.md](./IP-2026-11-06-cache-components-navigation.md) | Cache Components: Suspense, URL data, `connection()` | In progress |

Suggested first plan: `IP-*-immich-api-client-and-album-list` after UC for album queue exists.
