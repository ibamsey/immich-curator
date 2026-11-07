import { AppShell } from "@/components/shell/app-shell";
import type { ShellContext } from "@/lib/server/shell-context";

type AppShellRouteFallbackProps = {
  headerTitle: string;
  headerSubtitle?: string;
  loadingMessage: string;
  /** When omitted, uses a neutral placeholder (sync Suspense fallback for searchParams + instant pages). */
  shell?: ShellContext | null;
};

/**
 * Unified loading shell for route-level Suspense fallbacks.
 * Pass `shell` from `loadShellContext()` when the page loads it above Suspense;
 * omit for sync pages that delegate shell load to `*-data.tsx`.
 */
export function AppShellRouteFallback({
  shell,
  headerTitle,
  headerSubtitle = "Loading…",
  loadingMessage,
}: AppShellRouteFallbackProps) {
  return (
    <AppShell
      targetEmail={shell?.targetEmail ?? null}
      connectionOk={shell?.connectionOk ?? false}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <div
        data-testid="route-loading-fallback"
        className="p-6 text-sm text-muted-foreground"
      >
        {loadingMessage}
      </div>
    </AppShell>
  );
}
