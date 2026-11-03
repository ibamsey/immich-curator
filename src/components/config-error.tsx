import { AppShell } from "@/components/shell/app-shell";
import type { ShellContext } from "@/lib/server/shell-context";

type ConfigErrorProps = {
  shell: ShellContext;
  message: string;
};

export function ConfigError({ shell, message }: ConfigErrorProps) {
  return (
    <AppShell
      targetEmail={shell.targetEmail}
      connectionOk={shell.connectionOk}
      headerTitle="Configuration"
    >
      <div className="mx-auto max-w-lg p-8">
        <h2 className="text-lg font-semibold">Cannot load Explore</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-3 text-xs">
          cp .env.example .env.local{"\n"}
          # IMMICH_SERVER_URL, IMMICH_API_KEY{"\n"}
          # CURATOR_DEFAULT_ALBUM_ID or POUNDSGATE_ALBUM_ID
        </pre>
      </div>
    </AppShell>
  );
}
