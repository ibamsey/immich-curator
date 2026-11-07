import { AppShellRouteFallback } from "@/components/shell/app-shell-route-fallback";

/**
 * Sync shell for Suspense fallback only. When the page has `searchParams` + `instant`,
 * `loadShellContext()` runs inside `people-data.tsx` (inside Suspense).
 */
export function PeopleFallback() {
  return (
    <AppShellRouteFallback
      headerTitle="People"
      loadingMessage="Loading people catalogue…"
    />
  );
}
