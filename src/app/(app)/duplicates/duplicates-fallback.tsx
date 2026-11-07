import { AppShellRouteFallback } from "@/components/shell/app-shell-route-fallback";
import type { ShellContext } from "@/lib/server/shell-context";

export function DuplicatesFallback({ shell }: { shell: ShellContext }) {
  return (
    <AppShellRouteFallback
      shell={shell}
      headerTitle="Duplicates"
      loadingMessage="Loading duplicates…"
    />
  );
}
