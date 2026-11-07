import { AppShellRouteFallback } from "@/components/shell/app-shell-route-fallback";
import type { ShellContext } from "@/lib/server/shell-context";

export function AlbumsFallback({ shell }: { shell: ShellContext }) {
  return (
    <AppShellRouteFallback
      shell={shell}
      headerTitle="Albums"
      loadingMessage="Loading albums…"
    />
  );
}
