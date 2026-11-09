# immich-curator

A LAN-oriented **curation sidecar** for [Immich](https://immich.app): a dedicated web app where a **curator** (operator) helps another person **catalogue, sort, and annotate** a photo library on that person’s behalf. A typical scenario is helping someone digitise and organise an archive of old prints or scans—grouping images into albums (topics, events, families), **naming people**, writing **descriptions**, fixing dates and locations, and trimming obvious duplicate files. The curator is built for situations where the library owner has limited time or confidence with photo-management software: the expert does the heavy lifting in a focused UI while Immich remains the system of record.

A concrete example might be Ian curating **Geoff’s** old photo collection. The app models an **operator** (who uses the UI, comments on shared albums, and adds descriptions and people) and a **target** (the library owner whose API key performs those edits in Immich). See [docs/adr/0002-curator-operator-and-target.md](./docs/adr/0002-curator-operator-and-target.md).

## What you can do today

| Area | Route | Summary |
|------|--------|---------|
| **Explore** | `/explore` | Album-scoped asset queue; filter/sort/group; RHS curation panel (description, dates, comments, delete); face labels on grid; full-screen preview with face tools and optional raster edit. |
| **Albums** | `/albums` | List target albums, share/unshare with operator, in-album browse with same grid + panel patterns. |
| **People** | `/people` | People and faces in **albums shared with the operator**: name clusters, assign detections, merge similar names, per-person photos and linked faces, handoff to Explore. |
| **Duplicates** | `/duplicates` | Immich duplicate-**asset** groups; confirm and delete redundant copies. |
| **Locations** | `/locations` | Placeholder / early surface for map-related curation. |
| **Admin** | `/admin` | Curator identity, API keys, defaults (see UC-012). |

All Immich calls run **server-side** only ([ADR-0001](./docs/adr/0001-server-side-immich-api.md)).

Behavioural detail: [docs/use-cases/](./docs/use-cases/README.md) (UC-001–UC-019). Product narrative: [docs/user-stories/](./docs/user-stories/README.md).

## Why this folder is separate from `../immich`

| `../immich` | `immich-curator` |
|-------------|------------------|
| Docker/Postgres, import scripts, logs, staging | Next.js app only |
| Shell + Python ops | React + API routes |
| `.env` for immich-go | `.env.local` for curator (may copy `IMMICH_API_KEY`) |

Keeping the app as a **sibling** avoids file watchers on `logs/`, `postgres/`, and large zips under `immich/`.

## Documentation

[`docs/`](./docs/README.md) — user stories → use cases → designs → ADRs → implementation plans. Agents and contributors should read [AGENTS.md](./AGENTS.md) and `docs/` before large changes.

## Stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS v4, shadcn/ui

## Configuration

```bash
cp .env.example .env.local
# Target: IMMICH_API_KEY + IMMICH_SERVER_URL (same as Geoff in Immich)
# Operator: IMMICH_OPERATOR_API_KEY optional (album comments as invitee)
# CURATOR_DEFAULT_ALBUM_ID or album list default for Explore
```

Immich API reference: [https://docs.immich.app](https://docs.immich.app)

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000/explore](http://localhost:3000/explore) (root redirects to Explore).

```bash
npm run test    # Vitest
npm run build   # production build
```

### Production on dartmoor (systemd user unit)

```bash
# One-time: unit under ~/.config/systemd/user/
systemctl --user enable --now immich-curator
# After code changes:
npm run build && systemctl --user restart immich-curator
systemctl --user status immich-curator
```

Listens on `0.0.0.0:3000` on the LAN. Restrict with firewall; never expose API keys to the browser bundle.

## Related ops

Bulk import, scanner paths, and Immich server lifecycle live in [`/home/ian/immich`](../immich) (`import-scanned-photos.sh`, Docker compose, etc.).
