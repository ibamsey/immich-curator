import { AppShellRouteFallback } from "@/components/shell/app-shell-route-fallback";

/** Sync fallback; full shell loads inside ExploreData (inside Suspense). */
export function ExploreFallback() {
  return (
    <AppShellRouteFallback
      headerTitle="Explore"
      loadingMessage="Loading album…"
    />
  );
}
