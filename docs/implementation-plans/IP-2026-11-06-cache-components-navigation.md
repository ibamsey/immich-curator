# IP-2026-11-06: Cache Components navigation and prerender hygiene

## Context

The app uses Next.js 16 with **`cacheComponents`** and **`partialPrefetching`** enabled. That mode validates:

1. **Uncached data** (e.g. `fetch(..., { cache: "no-store" })`) during client navigations — should sit **inside `<Suspense>`** (or behind `"use cache"` where appropriate).
2. **URL data** — `await searchParams` / params should be read **inside the same async branch** that is wrapped by `<Suspense>` (or behind `loading.js` / cached boundaries per [instant navigation](https://nextjs.org/docs/app/guides/instant-navigation)), not in the parent page above Suspense.
3. **Unstable time** — with Cache Components, `Date.now()` / `new Date()` without args are treated as sync I/O during prerender; use **`await connection()`** before code that needs “current time” or that pulls in libraries that use it, or move time-sensitive UI to the client.

Earlier issues in this repo: People route (uncached Immich + `searchParams`), `Date.now()` prerender overlay, and **`connection()`** placement (must not block the page segment above Suspense if instant navigation is desired).

## Current target pattern (implemented for People & Explore)

- **Page**: `await loadShellContext()` only; `<Suspense fallback={...}>` wraps a single async child.
- **Data child**: `await connection()` (if needed for time-dependent stack), `await searchParams` (or `params`), then Immich / uncached work.

## Refactoring plan (remaining routes and consistency)

### Phase 1 — Align all `searchParams` routes

- [ ] Audit `src/app/(app)/**/page.tsx` for `await searchParams` or `await params` **above** `<Suspense>`.
- [ ] Move URL resolution into the existing `*-data.tsx` (or add one): pass **`searchParams` promise** (or `params` promise) as a prop; await inside the Suspense child.

### Phase 2 — `connection()` placement

- [ ] Keep **`connection()`** only inside Suspense-backed async children (or after entering a dynamic stage), not as the first line of the page when the page also needs to stay “instant” under validation.
- [ ] For routes with **no** `searchParams` and no time-sensitive deps, consider **removing** `connection()` and rely on natural dynamic boundaries; re-run dev overlay after each change.

### Phase 3 — Heavy / uncached pages without Suspense

- [ ] **Albums, Duplicates, Admin, Locations**: mirror Explore/People — thin page + `Suspense` + `*-data.tsx` + shared shell fallback pattern (or `loading.tsx` where a route-level skeleton is enough).
- [ ] Ensure **`loadShellContext()`** stays cached (`"use cache"` + short `cacheLife`) and is safe to call from the page shell.

### Phase 4 — Instant segment config

- [ ] `(app)/layout.tsx` uses `export const instant = false` to allow blocking at the group layout where needed.
- [ ] Optionally set **`instant = true`** on specific leaf pages **after** Phases 1–3 so Next validates only segments that are meant to be instant (see [instant route config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant)).

### Phase 5 — Tooling and cleanup

- [ ] Fix **ESLint** `react-hooks/refs` violations (e.g. ref updates during render) so `npm run lint` passes in CI.
- [ ] Add **`immich.code-workspace`** to `.gitignore` if it stays local-only.
- [ ] Document this pattern in `AGENTS.md` (short “Cache Components” subsection: Suspense + URL data + `connection()`).

## Verification

- `npm run dev` — navigate between `/explore`, `/people`, `/albums`, `/duplicates`; no dev overlay for uncached data, URL outside Suspense, or unstable `Date` where fixed.
- `npm run build`
- Optional: enable stricter instant validation in `next.config` only after routes are migrated.

## References

- [Instant navigation](https://nextjs.org/docs/app/guides/instant-navigation)
- [Cache Components migration](https://nextjs.org/docs/app/guides/migrating-to-cache-components)
- [loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
