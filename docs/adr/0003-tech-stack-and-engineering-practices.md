# ADR 0003: Tech stack and engineering practices

- **Status:** Accepted
- **Date:** 2026-11-03
- **Deciders:** Operator, immich-curator maintainers
- **Related:** [ADR-0001](./0001-server-side-immich-api.md), [AGENTS.md](../../AGENTS.md)

## Context

immich-curator is a greenfield LAN app. Agents and contributors need a single record of the **chosen stack** and **how to implement** on it: current framework versions, simplicity, one clear path per concern, typed styling, library reuse, and proportionate testing—without cargo-cult or duplicate abstractions.

## Decision — suggested tech stack

| Layer | Choice | Notes |
|-------|--------|--------|
| Runtime | Node.js (LTS aligned with Next) | Same host as Immich on dartmoor |
| Framework | **Next.js 16** App Router | Server Components + Route Handlers; read `node_modules/next/dist/docs/` before coding ([AGENTS.md](../../AGENTS.md)) |
| UI | **React 19** | Match Next peer versions |
| Language | **TypeScript 5** | Strict typing; no untyped escape hatches without justification |
| Styling | **Tailwind CSS v4** | Token-based; central theme definition (CSS variables / `@theme`) |
| Components | **shadcn/ui** + **Base UI** + **lucide-react** | Primitives under `src/components/ui/`; extend, don’t fork unnecessarily |
| Utilities | **class-variance-authority**, **cn** | Variant patterns for UI components |
| Lint | **ESLint 9** + `eslint-config-next` | Run `npm run lint` on app changes |
| External API | Immich REST | Server-only client ([ADR-0001](./0001-server-side-immich-api.md)) |
| Tests | **Vitest** (or Jest) + **React Testing Library** when introduced | See TDD section below; add to `package.json` in first implementation plan that needs tests |

Versions are pinned in [`package.json`](../../package.json); upgrade deliberately with lint/build green.

## Decision — instructions for agents and contributors

Follow **current official documentation** for each technology above. Prefer **latest stable practices** supported by this repo’s pinned versions—not patterns from older Next/React major versions unless this codebase already uses them.

### Simplicity and architecture

- Keep structure **as simple as necessary** for the use case. No extra layers, generic repositories, or “future-proof” abstractions without a documented need (user story / use case / ADR).
- Avoid **unjustified advanced techniques** (custom frameworks, meta-programming, premature micro-frontends, event buses for local UI state, etc.).
- **One canonical code path** per behaviour: e.g. a single Immich HTTP client module used by all Route Handlers; one album-list fetch; one asset-update path. If two implementations look similar, **consolidate** before adding features.
- Prefer **flat, feature-oriented** folders under `src/` that match docs (`app/`, `lib/immich/`, `components/`) over deep hierarchy.

### TypeScript and libraries

- Use **TypeScript throughout**; enable strict checks; model Immich payloads and app config with types/interfaces (shared `types/` or colocated with `lib/immich`).
- **Do not reimplement** what maintained libraries already solve: HTTP (native `fetch` + thin wrapper is enough), dates (e.g. `date-fns` if needed), validation (e.g. **Zod** for env and API bodies when introduced), class merging (`cn`), etc.
- Add dependencies sparingly; justify in implementation plan or PR notes.

### UI feedback and dialogs

- **Do not use** native browser dialogs for in-app UX: no `window.alert`, `window.confirm`, or `window.prompt`.
- Use **in-app modals** built from shared primitives (`src/components/ui/dialog.tsx`, `ConfirmDialog` in `confirm-dialog.tsx`) so copy, focus, and theme match the shell ([floorplan](../designs/user-interface/floorplan.md)).
- Destructive or irreversible actions (e.g. unshare, delete) use a **confirm dialog** with explicit Cancel / Confirm; inline errors stay in panel text, not alerts.

### Styling and theme

- **Token-based styling only** for colours, spacing, radius, typography: define tokens in a **central theme** (e.g. `src/app/globals.css` with Tailwind v4 `@theme`, CSS variables for light/dark).
- Components consume tokens (`bg-background`, `text-muted-foreground`, semantic names)—not ad hoc hex values scattered in JSX.
- Align with Immich-like dark UI where [floorplan](../designs/user-interface/floorplan.md) calls for it; extend theme tokens rather than one-off classes.

### Testing (TDD at appropriate level)

- **Unit tests** for pure logic: Immich response mappers, config parsing, share-role defaults, URL builders.
- **Integration tests** for Route Handlers with mocked `fetch` to Immich (no real key in CI).
- **Component tests** for non-trivial UI (forms, panel state) with React Testing Library—behaviour-focused, not snapshot churn.
- **E2E** only when use-case critical paths stabilise (optional Playwright later); not required for every change.
- Practice **proportionate TDD**: write or update tests when fixing bugs or implementing UC acceptance criteria; red-green-refactor for core `lib/` modules; don’t block small doc-only or config-only work on full test suites.

### Verification before merge

- `npm run lint` and `npm run build` for application code changes.
- Manual or scripted check against local Immich when touching API integration.

## Consequences

### Positive

- Consistent, readable codebase aligned with modern Next/React.
- Easier agent and human onboarding via one ADR + AGENTS.md.
- Theme and client modules stay DRY and typed.

### Negative / trade-offs

- Strict “one path” rule may require refactors when experiments land; prefer refactor over parallel paths.
- TDD scope is judgment-based; critical paths should gain tests incrementally in implementation plans.

## References

- [Next.js docs](https://nextjs.org/docs) (match major version in `package.json`)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [docs/designs/user-interface/floorplan.md](../designs/user-interface/floorplan.md)
