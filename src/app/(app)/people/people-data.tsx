import { connection } from "next/server";
import { getPeopleInSharedScope } from "@/lib/immich/people";
import { resolveOperatorUserIdCached } from "@/lib/immich/users";
import { PeopleWorkspace } from "@/components/people/people-workspace";
import { peopleTabForSelection } from "@/lib/people/bucket-people";
import type { ShellContext } from "@/lib/server/shell-context";

type PeopleDataProps = {
  shell: ShellContext;
  searchParams: Promise<{
    personId?: string;
    tab?: "faces" | "duplicates" | string;
  }>;
};

export async function PeopleData({ shell, searchParams }: PeopleDataProps) {
  await connection();
  const params = await searchParams;
  const initialPersonId = params.personId?.trim() || null;
  const requestedTab = params.tab;

  let initialPeople: Awaited<
    ReturnType<typeof getPeopleInSharedScope>
  >["people"] = [];
  let initialSharedAlbumIds: string[] = [];
  let loadError: string | null = null;

  try {
    const operatorUserId = await resolveOperatorUserIdCached();
    const data = await getPeopleInSharedScope(operatorUserId);
    initialPeople = data.people;
    initialSharedAlbumIds = data.sharedAlbumIds;
  } catch (e) {
    loadError =
      e instanceof Error ? e.message : "Could not load people catalogue.";
  }

  return (
    <PeopleWorkspace
      shell={shell}
      initialPeople={initialPeople}
      initialSharedAlbumIds={initialSharedAlbumIds}
      loadError={loadError}
      initialTab={peopleTabForSelection(
        initialPeople.find((person) => person.id === initialPersonId),
        requestedTab,
      )}
      initialSelectedPersonId={initialPersonId}
    />
  );
}
