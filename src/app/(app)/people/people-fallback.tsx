import { AppShell } from "@/components/shell/app-shell";
import type { ShellContext } from "@/lib/server/shell-context";

export function PeopleFallback({ shell }: { shell: ShellContext }) {
  return (
    <AppShell
      targetEmail={shell.targetEmail}
      connectionOk={shell.connectionOk}
      headerTitle="People"
      headerSubtitle="Loading…"
    >
      <div className="p-6 text-sm text-muted-foreground">
        Loading people catalogue…
      </div>
    </AppShell>
  );
}
