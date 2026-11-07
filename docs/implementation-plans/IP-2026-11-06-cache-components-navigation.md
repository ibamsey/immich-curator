# IP-2026-11-06: Cache Components navigation and prerender hygiene

**Status:** Done

## Context

The app uses Next.js 16 with **`cacheComponents`** and **`partialPrefetching`** enabled. That mode validates:

1. **Uncached data** (e.g. `fetch(..., { cache: "no-store" })`) during client navigations — should sit **inside `<Suspense>`** (or behind `"use cache"` where appropriate).
2. **URL data** — `await searchParams` / params should be read **inside the same async branch** that is wrapped by `<Suspense>` (or behind `loading.js` / cached boundaries per [instant navigation](https://nextjs.org/docs/app/guides/instant-navigation)), not in the parent page above Suspense.
3. **Unstable time** — with Cache Components, `Date.now()` / `new Date()` without args are treated as sync I/O during prerender; use **`await connection()`** before code that needs “current time” or that pulls in libraries that use it, or move time-sensitive UI to the client.

Earlier issues in this repo: People route (uncached Immich + `searchParams`), `Date.now()` prerender overlay, and **`connection()`** placement (must not block the page segment above Suspense if instant navigation is desired).

## Current target pattern (all `(app)` data routes)

- **Page without URL props:** `await loadShellContext()` then `<Suspense>`; **`export const instant = true`** where desired.
- **Page with `searchParams` and `instant = true`:** **`page.tsx` must be synchronous** (no `await` above Suspense). Pass `searchParams` as a Promise into `*-data.tsx`. **`await loadShellContext()` lives in the data child** with URL resolution and Immich work. Fallback UI is sync (placeholder shell only).
- **Data child:** `await connection()` when needed, then `loadShellContext` if page is sync-only, then `await searchParams` / `params`, then Immich / uncached work.

## Refactoring plan — completion checklist

### Phase 1 — Align all `searchParams` routes

- [x] Audit `src/app/(app)/**/page.tsx` for `await searchParams` or `await params` **above** `<Suspense>`.
- [x] URL resolution lives in `*-data.tsx` with **`searchParams` promise** passed from the page (Explore, People).

### Phase 2 — `connection()` placement

- [x] **`connection()`** only inside Suspense-backed async children (Explore, People, Albums, Duplicates, Admin data components).
- [x] **`explore/loading.tsx`**: removed redundant `connection()`; only `loadShellContext` + fallback UI.

### Phase 3 — Heavy / uncached pages without Suspense

- [x] **Albums, Duplicates, Admin, Locations**: thin page + `Suspense` + `*-data.tsx` + `*-fallback.tsx`.
- [x] **`loadShellContext()`** remains cached in [`src/lib/server/shell-context.ts`](../../src/lib/server/shell-context.ts).

### Phase 4 — Instant segment config

- [x] `(app)/layout.tsx` keeps `export const instant = false` where needed for the group.
- [x] Leaf **`export const instant = true`** on Explore, People, Albums, Duplicates, Admin, Locations.

### Phase 5 — Tooling and cleanup

- [x] **ESLint**: refs during render fixed (`asset-grid`, `face-name-box`); `person-identity-editor` ref sync via effect; **no JSX in try/catch** in `duplicates-data` for `react-hooks/error-boundaries`.
- [x] **`immich.code-workspace`** added to `.gitignore`.
- [x] **Agent docs:** [`.cursor/skills/immich-curator-cache-components/SKILL.md`](../../.cursor/skills/immich-curator-cache-components/SKILL.md), pointer in [`AGENTS.md`](../../AGENTS.md), cross-link in [`.cursor/rules/docs-and-agentic-workflow.mdc`](../../.cursor/rules/docs-and-agentic-workflow.mdc).

## Verification

- [x] `npm run lint`
- [x] `npm run build`
- [x] Manual (wrap-up 2026-11-06, dartmoor): `npm run dev` — navigate `/explore`, `/people`, `/albums`, `/duplicates`, `/admin`, `/locations` (HTTP smoke + no blocking overlay on exercised routes); `npm run build` + `npm run lint` clean after `AppShellRouteFallback` + SideNav prefetch.

## References

- [Instant navigation](https://nextjs.org/docs/app/guides/instant-navigation)
- [Cache Components migration](https://nextjs.org/docs/app/guides/migrating-to-cache-components)
- [loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
