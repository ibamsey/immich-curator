import { tryGetCuratorEnv } from "@/lib/config/env";
import { resolveOperatorUserId } from "@/lib/immich/users";
import { loadShellContext } from "@/lib/server/shell-context";
import { AppShell } from "@/components/shell/app-shell";

export default async function AdminPage() {
  const shell = await loadShellContext();
  const env = tryGetCuratorEnv();
  const operatorUserId = env ? await resolveOperatorUserId() : null;

  return (
    <AppShell
      targetEmail={shell.targetEmail}
      connectionOk={shell.connectionOk}
      headerTitle="Admin"
      headerSubtitle="Curator operator and target"
    >
      <div className="mx-auto max-w-lg space-y-6 p-8 text-sm">
        <section>
          <h2 className="font-semibold">Curator target</h2>
          <p className="mt-1 text-muted-foreground">
            Library owner (API key). Shown when Immich is reachable.
          </p>
          <p className="mt-2 font-mono text-xs">
            {shell.targetEmail ?? "—"}
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Curator operator</h2>
          <p className="mt-1 text-muted-foreground">
            Default album-share collaborator (env).
          </p>
          <p className="mt-2 font-mono text-xs">
            {env?.operatorEmail ?? "CURATOR_OPERATOR_EMAIL not set"}
          </p>
          <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
            {operatorUserId ?? env?.operatorUserId ?? "User id not resolved"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Default share role: {env?.defaultShareRole ?? "—"}
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Default album</h2>
          <p className="mt-2 font-mono text-xs break-all">
            {env?.defaultAlbumId ?? "—"}
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Immich server</h2>
          <p className="mt-2 font-mono text-xs">
            {env?.immichServerUrl ?? "Configure .env.local"}
          </p>
        </section>
        <p className="text-xs text-muted-foreground">
          API keys are only read from <code>.env.local</code> on the server.
          Edit env and restart <code>npm run dev</code> to change target.
        </p>
      </div>
    </AppShell>
  );
}
