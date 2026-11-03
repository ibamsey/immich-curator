# Designs

UX, API integration, and component architecture. Written after use cases, before large implementation efforts.

## Contents

| Kind | Where |
|------|--------|
| UI shell / floorplan | [user-interface/floorplan.md](./user-interface/floorplan.md) |
| UI / wireframes | `DES-NNN-*.md` or `user-interface/` (markdown + links to Figma or screenshots) |
| API integration | Immich routes proxied under `src/app/api/` |
| Security | LAN binding, key storage, no client-side secrets |

## Template

```markdown
# DES-NNN: Title

**Traces to:** UC-NNN, US-NNN

## Goals / non-goals

## User interface

## Server / data flow

## Open questions
```

## Index

| ID | Title | Status |
|----|-------|--------|
| UI floorplan | [user-interface/floorplan.md](./user-interface/floorplan.md) | Draft |
| [DES-001](./DES-001-explore-demo-and-theme.md) | Explore demo + theme | Accepted |
| [DES-003](./DES-003-albums-list-and-share.md) | Albums list + share | Accepted |
| [DES-004](./DES-004-asset-curation-panel.md) | Asset curation RHS panel | Accepted |
| [DES-002](./DES-002-curator-identity-admin.md) | Curator operator/target Admin | Accepted |
| [DES-005](./DES-005-people-catalogue-and-panel.md) | People catalogue + asset panel | Accepted |
