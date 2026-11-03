# Curator UI floorplan

**Traces to:** [US-001](../../user-stories/US-001-geoff-knows-ian-catalogs.md), [US-002](../../user-stories/US-002-split-albums-shared-with-ian.md), UC-004–UC-012  
**Status:** Draft  
**Reference:** Immich web app layout (sidebar navigation, top bar, responsive main area). Curator is a **LAN sidecar for Ian** acting on **Geoff’s library** via server-side API—not a full Immich clone.

## Design intent

| Align with Immich | Deliberately different |
|-------------------|-------------------------|
| Three-band shell: **nav | header | content** | No Photos / Sharing / Utilities parity |
| Grid and detail patterns for assets | Nav emphasises **curation**: Explore, People, Locations, Albums |
| Dark-friendly, dense photo UI | Header actions are **curator tools**, not upload-first |
| — | **RHS slide-in panel** for context + actions (Immich often uses modals / asset viewer) |

Geoff continues identification in **Immich proper** ([UC-002](../../use-cases/UC-002-geoff-edit-description-and-name-faces.md)). Curator optimises Ian’s queue: read Geoff’s description, tags, location, album admin, corrections as Geoff.

## Shell layout (desktop)

Fixed **left sidebar** (primary nav). **Header** spans main column. **Main canvas** fills remaining space. **Context panel** slides in from the **right**, overlaying or squeezing the canvas (prefer overlay on narrow widths; push on wide).

```
┌──────────┬────────────────────────────────────────────────────────────┐
│          │  HEADER  [album scope]     [action icons …]    [panel toggle]│
│   LHS    ├──────────────────────────────────────────────┬───────────────┤
│   NAV    │                                              │               │
│          │              MAIN CANVAS                     │  RHS CONTEXT  │
│ Explore  │         (route-specific content)             │  PANEL        │
│ People   │                                              │  (slide-in)   │
│ Locations│                                              │               │
│ Albums   │                                              │               │
│          │                                              │               │
└──────────┴──────────────────────────────────────────────┴───────────────┘
```

### Region responsibilities

| Region | Role |
|--------|------|
| **LHS nav** | Top-level routes only; no nested Immich admin tree. Active item highlights; optional badge (e.g. album count). |
| **Header** | Global scope (selected album / “all configured albums”), search or filter entry, **action icons** for the current route or selection. Opens or updates RHS panel when relevant. |
| **Main canvas** | Route body: grids, map, album list, people list, album admin tables. Selection in canvas drives panel content. |
| **RHS panel** | **Contextual** summary + **actions** for selection (asset, person, place cluster, album). Closes with escape, backdrop click, or toggle; state preserved while navigating within same route when practical. |

## Left-hand navigation

Four items (order fixed for muscle memory with Immich “Explore” familiarity):

| Nav item | Route (suggested) | Main canvas | Typical panel content |
|----------|-------------------|-------------|------------------------|
| **Explore** | `/explore` | Asset grid / queue for curation (default landing). Filter: needs tags, missing location, etc. | Asset thumb, Geoff description, tags, location, faces summary, actions: edit tags, set location, fix description, open in Immich (link). |
| **People** | `/people` | Shared-album person catalogue ([UC-014](../../use-cases/UC-014-browse-people-in-shared-albums.md)): face tiles with inline name + DOB. | Asset grid (thumb + description) for selected person; double-click → Explore ([UC-004](../../use-cases/UC-004-browse-album-assets-in-curator.md)). |
| **Locations** | `/locations` | Map and/or location groups (assets with coords vs missing). | Place label, coords, asset list at pin; action: set location ([UC-006](../../use-cases/UC-006-ian-set-asset-map-location.md)). |
| **Albums** | `/albums` | **All** Geoff-owned albums from API ([UC-009](../../use-cases/UC-009-album-crud-in-curator.md) Read). List + drill into album grid. | Album title, share status, asset count; actions: create, share with **operator**, edit metadata, move assets ([UC-009](../../use-cases/UC-009-album-crud-in-curator.md), [UC-010](../../use-cases/UC-010-move-assets-between-albums.md)). |

**Not in LHS nav (v1):** Upload (use dartmoor import [UC-001](../../use-cases/UC-001-ingest-scanned-photos-poundsgate.md)), Immich server admin, Trash, Partners, Favorites as top-level items.

**Sidebar footer:** connection indicator; **Target:** `{targetEmail}` (from API / [UC-012](../../use-cases/UC-012-configure-curator-identity.md)); link **Admin** → `/admin` ([DES-002](../DES-002-curator-identity-admin.md)). Not a login switcher—target is set by deployment config.

## Header and action icons

Header is **context-aware**: icons enable/disable based on route and selection. Group related actions; use tooltips. Prefer panel-hosted forms for multi-field edits; icons trigger panel sections or immediate actions.

**Global (most routes)**

| Icon / control | Behaviour |
|----------------|-----------|
| Album scope dropdown | Limits Explore / Locations to one Geoff album or “all albums” (list from [UC-009](../../use-cases/UC-009-album-crud-in-curator.md)). |
| Search / filter | Text search; quick filters (untagged, no location). |
| Panel toggle | Show/hide RHS panel; remembers width preference locally. |

**Explore (asset selected)**

| Action | Maps to |
|--------|---------|
| Tags | Panel → tag editor [UC-005](../../use-cases/UC-005-ian-assign-tags-to-asset.md) |
| Location | Panel → map pin [UC-006](../../use-cases/UC-006-ian-set-asset-map-location.md) |
| Description | Panel → text edit [UC-007](../../use-cases/UC-007-ian-correct-asset-description.md) |
| External | Open asset in Immich (new tab, Geoff/Ian URL as configured) |

**Albums**

| Action | Maps to |
|--------|---------|
| New album | [UC-009](../../use-cases/UC-009-album-crud-in-curator.md) Create |
| Share | [UC-009](../../use-cases/UC-009-album-crud-in-curator.md) Share with operator |
| Move | Move to album [UC-010](../../use-cases/UC-010-move-assets-between-albums.md) (requires selection from album grid) |

**People**

| Action | Save name/DOB on catalogue tile [UC-014](../../use-cases/UC-014-browse-people-in-shared-albums.md); open asset in Explore from panel grid |

Exact icon set follows shadcn/lucide conventions in implementation; names here are semantic.

## RHS context panel

**Pattern:** Slide-in from right; min width ~320px, max ~480px on desktop; full-width sheet on mobile.

**Sections (stacked, collapsible where heavy):**

1. **Selection header** — title (filename, person name, album name, or place).
2. **Context** — read-only Geoff description, Immich metadata, album membership, import tags.
3. **Actions** — primary button(s) for the active use case; secondary links (Immich UI).
4. **Related** — thumbnails of linked assets (faces, same location, same album).

**Interaction rules**

- Single selection: panel binds to one entity.
- Multi-select on Explore / Albums: panel shows count + bulk actions (tags, move) with shared form.
- No selection: panel collapsed or shows route help / filter summary.
- Errors from Immich API surface inline in panel (never expose API key).

## Main canvas by route (sketch)

### Explore

- Immich-like **responsive grid** of thumbnails.
- Optional **list mode** for queue metadata columns (description snippet, tag count).
- Keyboard: arrow navigation, enter opens panel focus.

### People

- Grid of person face thumbnails with **name** and **DOB** fields under each tile ([DES-005](../DES-005-people-catalogue-and-panel.md)).
- Click person → RHS panel shows in-scope assets (shared albums) with descriptions; double-click asset → Explore.

### Locations

- **Map** (primary) with clusters; list sidebar or toggle for assets missing location.
- Click pin → panel lists assets at location.

### Albums

- **Album cards** (cover, title, asset count, shared badge).
- Enter album → same grid component as Explore, scoped to album ID; breadcrumb in header back to album list.

## Responsive behaviour

| Breakpoint | Nav | Panel |
|------------|-----|-------|
| Desktop | Persistent sidebar | Push or overlay; resizable optional later |
| Tablet | Collapsible sidebar (hamburger) | Overlay |
| Mobile | Bottom nav or drawer for four items | Full-screen sheet |

## Non-goals (floorplan v1)

- Pixel-perfect Immich parity or shared component library with Immich.
- Geoff login or multi-user session switching in the browser.
- Full asset viewer (zoom, slideshow)—defer to Immich link or lightbox later.
- Public share links, search across entire server beyond configured albums.

## Open questions

- Default landing: **Explore** with album scope = Poundsgate only vs all configured albums?
- Panel **push** vs **overlay** on desktop default?
- Bulk move UI: wizard in panel vs dedicated Albums sub-route?

## Traceability

| Design area | Use cases |
|-------------|-----------|
| Explore + panel | UC-004, UC-005, UC-006, UC-007 |
| People + panel | UC-014, UC-008 |
| Locations | UC-006 |
| Albums + header actions | UC-009, UC-010, UC-012 |
| Channel copy / Immich link | UC-013 |

Implementation plans should map React layout components to this floorplan (`AppShell`, `SideNav`, `AppHeader`, `ContextPanel`, route layouts under `src/app/`).
