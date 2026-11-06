import { AppShell } from "@/components/shell/app-shell";
import type { ShellContext } from "@/lib/server/shell-context";

export function ExploreFallback({ shell }: { shell: ShellContext }) {
  return (
    <AppShell
      targetEmail={shell.targetEmail}
      connectionOk={shell.connectionOk}
      headerTitle="Explore"
      headerSubtitle="Loading…"
    >
      <div className="p-6 text-sm text-muted-foreground">Loading album…</div>
    </AppShell>
  );
}
