# immich-curator

LAN-oriented sidecar for cataloging Geoff’s Poundsgate album in Immich. Ian uses this UI; the server calls Immich with **Geoff’s API key** (same permissions as Geoff in the web app).

## Why this folder is separate from `../immich`

| `../immich` | `immich-curator` |
|-------------|----------------------|
| Docker/Postgres, import scripts, logs, staging | Next.js app only |
| Shell + Python ops | React + API routes |
| `.env` for immich-go | `.env.local` for curator (may copy `IMMICH_API_KEY`) |

Keeping the app as a **sibling** avoids file watchers on `logs/`, `postgres/`, and large zips under `immich/`.

## Documentation

Product and engineering docs live in [`docs/`](./docs/README.md): user stories → use cases → designs → ADRs → implementation plans. Agents should read [AGENTS.md](./AGENTS.md) before coding.

## Stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS v4, shadcn/ui

## Configuration

```bash
cp .env.example .env.local
# Reuse Geoff key from ../immich/.env (IMMICH_API_KEY) if already set
```

Immich API docs: [https://docs.immich.app](https://docs.immich.app)

## Development

```bash
cp .env.example .env.local
# IMMICH_API_KEY, IMMICH_SERVER_URL, CURATOR_DEFAULT_ALBUM_ID (or POUNDSGATE_ALBUM_ID)
npm run dev
```

Open [http://localhost:3000/explore](http://localhost:3000/explore) (root redirects to Explore).

### Always run (systemd on dartmoor)

```bash
# One-time: unit is installed under ~/.config/systemd/user/
systemctl --user enable --now immich-curator
# After pulling or building app code:
npm run build && systemctl --user restart immich-curator
systemctl --user status immich-curator
```

Listens on **`0.0.0.0:3000`** (LAN). Restrict via firewall; API key stays **server-side** only.

## Related ops

Import and scanner workflow remain in [`/home/ian/immich`](../immich) (`import-scanned-photos.sh`, etc.).
