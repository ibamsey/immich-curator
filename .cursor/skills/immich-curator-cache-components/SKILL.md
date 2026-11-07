---
name: immich-curator-cache-components
description: Next.js 16 App Router with cacheComponents + partialPrefetching—Suspense, URL data, connection(), and Immich server fetches for immich-curator.
---

# immich-curator: Cache Components and instant navigation

**When to use this skill:** Any change to `src/app/` (especially `src/app/(app)/`), server components that call Immich, `next.config.ts`, or loading/navigation UX.

**Stack:** `cacheComponents: true` and `partialPrefetching: true` in [`next.config.ts`](../../../next.config.ts). See Next.js [instant navigation](https://nextjs.org/docs/app/guides/instant-navigation) and [migrating to Cache Components](https://nextjs.org/docs/app/guides/migrating-to-cache-components).

## Route shell pattern (thin `page.tsx`)

### Pages **without** `searchParams` / dynamic `params`

1. `await loadShellContext()` then **`<Suspense fallback={...}>`** with a fallback that can receive `shell` (optional).
2. Pass props into `*-data.tsx` as needed.

### Pages **with** `searchParams` (or dynamic segments) and **`export const instant = true`**

Instant validation treats the **whole async page** as tied to URL data. Any `await` in that page (including `loadShellContext()`) before `<Suspense>` can trigger **“URL data outside of Suspense”** even if you never awaited `searchParams` in the page.

**Fix:**

- Make **`page.tsx` synchronous**: only `return ( <Suspense fallback=…> <Data searchParams={searchParams} /> </Suspense> )`.
- Put **`await loadShellContext()` inside `*-data.tsx`**, together with `await searchParams` / `await params`, after `await connection()` when needed.
- Use a **sync `*-fallback.tsx`** that does **not** call `loadShellContext()` (placeholder header is fine; real shell shows when data resolves). See [`people/page.tsx`](../../../src/app/(app)/people/page.tsx) and [`people-data.tsx`](../../../src/app/(app)/people/people-data.tsx).

Pass **`searchParams` / `params` as Promise props** into the data child. Do **not** `await searchParams` in `page.tsx`.

## Data child (`*-data.tsx`)

- `await connection()` from `next/server` **first** when the subtree may hit unstable time (`Date.now()`, `new Date()`, or dependencies that do), so prerender does not treat clock reads as static shell IO.
- **`await loadShellContext()`** when the page is sync-only above Suspense (searchParams + instant pattern).
- Then `await searchParams` / `await params` if the route is URL-driven.
- Then uncached Immich work (`immichJson`, `fetch` with `cache: "no-store"`).

**Do not** put `await connection()` or uncached Immich at the top of `page.tsx` if the leaf should validate as instant: it blocks the segment above Suspense.

## `instant` segment config

- [`src/app/(app)/layout.tsx`](../../../src/app/(app)/layout.tsx) may use `export const instant = false` to allow blocking at the group when needed.
- Leaf pages that follow the thin shell + Suspense pattern may use `export const instant = true` so dev validation runs for those segments. See [`instant` route segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant).

## Anti-patterns

- Uncached `fetch` / Immich calls directly in `page.tsx` with no Suspense boundary (triggers “uncached data during navigation”).
- `await searchParams` or `await params` in `page.tsx` before `<Suspense>` (“URL data outside of Suspense”).
- **`async` `page.tsx` with `searchParams` + `instant = true`** and **any** `await` before `<Suspense>` — including `loadShellContext()` — can be reported as URL data outside Suspense; use a **sync** page and move shell load into `*-data.tsx`.
- `await connection()` as the first line of `page.tsx` while also expecting instant prefetch for that segment.

## Error handling in server data components

- Avoid **JSX inside `try/catch`**: assign `await` results first, then return JSX based on success/error (eslint `react-hooks/error-boundaries`).

## Verification

- `npm run dev` — navigate between main routes; watch the dev overlay.
- `npm run build`
- `npm run lint`
- **Optional E2E:** `npm run test:e2e` (see [`e2e/README.md`](../../../e2e/README.md); needs Playwright system deps or CI image).

## In-repo references

- [IP-2026-11-06-cache-components-navigation.md](../../../docs/implementation-plans/IP-2026-11-06-cache-components-navigation.md)
- Cached hot paths: [`loadShellContext`](../../../src/lib/server/shell-context.ts), [`resolveOperatorUserIdCached`](../../../src/lib/immich/users.ts)
