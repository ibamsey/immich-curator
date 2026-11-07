# Playwright E2E (optional)

## Prerequisites

- `npm install` (pulls `@playwright/test` and `@next/playwright`).
- Chromium: `npx playwright install chromium`
- **System libraries** (Linux): `npx playwright install-deps chromium` usually requires **sudo** (installs `libatk`, etc.). On dartmoor without those packages, `npm run test:e2e` fails at browser launch with a missing `.so` error—install deps once on the host or run E2E in CI/Docker with [Playwright’s base image](https://playwright.dev/docs/docker).

## Commands

- `npm run test:e2e` — starts dev server via `playwright.config.ts` `webServer` and runs tests.

## Instant navigation

[`instant-nav.spec.ts`](./instant-nav.spec.ts) uses `instant()` from `@next/playwright` to assert the route loading shell (`data-testid="route-loading-fallback"`) appears before full data.
