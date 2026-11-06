import { connection } from "next/server";
import { buildSanitizedAdminSettings } from "@/lib/config/admin-settings";
import { loadShellContext } from "@/lib/server/shell-context";
import { AppShell } from "@/components/shell/app-shell";
import { AdminSettingsWorkspace } from "@/components/admin/admin-settings-workspace";

export default async function AdminPage() {
  await connection();
  const shell = await loadShellContext();
  const initial = await buildSanitizedAdminSettings();

  return (
    <AppShell
      targetEmail={shell.targetEmail}
      connectionOk={shell.connectionOk}
      headerTitle="Admin"
      headerSubtitle="Curator operator and target"
    >
      <AdminSettingsWorkspace initial={initial} />
    </AppShell>
  );
}
