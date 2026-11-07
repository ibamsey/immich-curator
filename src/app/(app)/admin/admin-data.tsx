import { connection } from "next/server";
import { buildSanitizedAdminSettings } from "@/lib/config/admin-settings";
import { AppShell } from "@/components/shell/app-shell";
import { AdminSettingsWorkspace } from "@/components/admin/admin-settings-workspace";
import type { ShellContext } from "@/lib/server/shell-context";

type AdminDataProps = {
  shell: ShellContext;
};

export async function AdminData({ shell }: AdminDataProps) {
  await connection();
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
