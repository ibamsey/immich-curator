import { connection } from "next/server";
import { loadShellContext } from "@/lib/server/shell-context";
import { DuplicatesWorkspace } from "@/components/duplicates/duplicates-workspace";
import { ConfigError } from "@/components/config-error";
import { getDuplicateGroups } from "@/lib/immich/duplicates";
import type { ImmichDuplicateGroup } from "@/lib/immich/types";

export default async function DuplicatesPage() {
  await connection();
  const shell = await loadShellContext();

  let initialGroups: ImmichDuplicateGroup[] = [];
  try {
    initialGroups = await getDuplicateGroups();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not load duplicates from Immich.";
    return (
      <ConfigError
        shell={shell}
        message={message}
        headerTitle="Duplicates"
        heading="Cannot load duplicates"
      />
    );
  }

  return (
    <DuplicatesWorkspace shell={shell} initialGroups={initialGroups} />
  );
}
