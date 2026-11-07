<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# immich-curator — agent instructions

## Project

LAN Next.js sidecar for Poundsgate: Ian catalogs Geoff-owned Immich assets via **Geoff’s API key** (server-side only). See [README.md](./README.md).

## Documentation-first workflow

Before implementing features, read and update docs in order:

1. [docs/user-stories/](./docs/user-stories/)
2. [docs/use-cases/](./docs/use-cases/)
3. [docs/designs/](./docs/designs/)
4. [docs/adr/](./docs/adr/)
5. [docs/implementation-plans/](./docs/implementation-plans/)

Index and naming rules: [docs/README.md](./docs/README.md).

If the user asks for code without docs, prefer creating minimal story + plan stubs first, unless they waive documentation explicitly.

## Technical constraints (summary)

- **ADR-0001:** Immich calls only on the server; no `NEXT_PUBLIC_` secrets.
- **ADR-0002:** **Curator target** (API key owner) and **curator operator** (share collaborator)—configure via env / Admin ([UC-012](./docs/use-cases/UC-012-configure-curator-identity.md)); do not hard-code Immich users in code.
- **ADR-0003:** [Tech stack and engineering practices](./docs/adr/0003-tech-stack-and-engineering-practices.md)—follow **latest stable practices** for that stack; keep architecture **simple**; **one code path** per concern; **token-based** central theme; prefer **typed libraries** over custom code; **proportionate TDD**. Read ADR-0003 before non-trivial implementation.
- Immich server on dartmoor: `http://127.0.0.1:2283` (see `.env.example`).
- Ops sibling repo: [`../immich`](../immich) (imports, keys, server docs).

## Code conventions

- Minimize scope; match existing patterns in `src/`.
- **Cache Components / instant navigation:** read [`.cursor/skills/immich-curator-cache-components/SKILL.md`](./.cursor/skills/immich-curator-cache-components/SKILL.md) before changing `src/app/(app)/` routes—Suspense, `*-data.tsx`, URL promises, `connection()` only inside data children; with **`searchParams` + `instant = true`**, keep `page.tsx` **sync** and load shell in `*-data.tsx`.
- Prefer Route Handlers under `src/app/api/` for Immich proxy endpoints.
- Do not commit `.env.local` or API keys.
- Full stack list, styling rules, testing guidance, and **no native alert/confirm**: **ADR-0003**.

## Agent behaviour (start/stop services)

When verification or the user’s goal needs something running (e.g. `npm run dev`, `systemctl --user start/stop immich-curator`, Docker compose), **run the appropriate commands yourself** in the terminal and confirm they work—**do not** default to telling the user to do it for you. Only hand off when execution is blocked (no shell, missing secrets, sudo-only steps, or actions the user must explicitly approve).

Pick the lightest option that fits the task: **development** → `npm run dev` (see below); **production / dartmoor always-on** → build + systemd per **Always-on service** below. Avoid leaving duplicate servers on the same port.

### Development (hot reload)

When you are iterating on app code in a dev context, **run and use the Next dev server**, not only `next build` + systemd:

- Start (or ensure) `npm run dev` from this repo; verify UI and APIs against that process (default `http://127.0.0.1:3000`).
- **Port 3000:** If `systemctl --user status immich-curator` shows the production unit already listening on 3000, either `systemctl --user stop immich-curator` for the dev session, or run dev on another port, e.g. `npm run dev -- -p 3001`, and curl/check that URL instead.

Do not tell the user to start dev for you unless the shell is blocked.

## Always-on service (dartmoor)

immich-curator runs as a **user systemd unit** (enabled at login):

- Unit: `~/.config/systemd/user/immich-curator.service` (source: [`scripts/systemd/immich-curator.service`](./scripts/systemd/immich-curator.service))
- **After code changes (production path):** `npm run build && systemctl --user restart immich-curator` — **run this in the agent session as soon as app code changes land** when validating the deployed service (no “pull first” or “you run it” handoff unless the shell is blocked or restart is not permitted).
- Status: `systemctl --user status immich-curator`
- LAN: `http://<host>:3000/explore` (binds `0.0.0.0:3000`)

When implementing or verifying against **production**, **ensure the systemd service is running** (restart after build if you changed app code). Do not leave a stray manual `next start` on other ports unless debugging.

Boot without login: `loginctl enable-linger ian` (optional).

## Verification

- **Development:** `npm run lint`; with **`npm run dev` running**, curl or open the dev base URL (e.g. `http://127.0.0.1:3000/api/immich/health` or `/explore`, or the alternate port if you used `-p`).
- **Production / systemd:** `npm run lint`, `npm run build`, then **`systemctl --user restart immich-curator` in the same session**. Do not stop at “deploy notes” for the user—execute the build and restart yourself when that path applies.
- **Optional E2E:** `npm run test:e2e` runs Playwright against the dev server; on Linux you need Chromium plus system libraries (`playwright install` + usually `sudo playwright install-deps chromium`). See [`e2e/README.md`](./e2e/README.md).

For Immich integration checks, use the URL that matches the process you are verifying (dev server vs systemd on 3000).
