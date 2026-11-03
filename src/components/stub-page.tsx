import { AppShell } from "@/components/shell/app-shell";
import type { ShellContext } from "@/lib/server/shell-context";

type StubPageProps = {
  shell: ShellContext;
  title: string;
};

export function StubPage({ shell, title }: StubPageProps) {
  return (
    <AppShell
      targetEmail={shell.targetEmail}
      connectionOk={shell.connectionOk}
      headerTitle={title}
    >
      <p className="p-8 text-sm text-muted-foreground">Coming soon.</p>
    </AppShell>
  );
}
