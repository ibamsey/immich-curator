import { connection } from "next/server";
import { DuplicatesWorkspace } from "@/components/duplicates/duplicates-workspace";
import { ConfigError } from "@/components/config-error";
import { getDuplicateGroups } from "@/lib/immich/duplicates";
import type { ImmichDuplicateGroup } from "@/lib/immich/types";
import type { ShellContext } from "@/lib/server/shell-context";

type DuplicatesDataProps = {
  shell: ShellContext;
};

export async function DuplicatesData({ shell }: DuplicatesDataProps) {
  await connection();

  let initialGroups: ImmichDuplicateGroup[] = [];
  let loadError: string | null = null;
  try {
    initialGroups = await getDuplicateGroups();
  } catch (e) {
    loadError =
      e instanceof Error ? e.message : "Could not load duplicates from Immich.";
  }

  if (loadError) {
    return (
      <ConfigError
        shell={shell}
        message={loadError}
        headerTitle="Duplicates"
        heading="Cannot load duplicates"
      />
    );
  }

  return (
    <DuplicatesWorkspace shell={shell} initialGroups={initialGroups} />
  );
}
