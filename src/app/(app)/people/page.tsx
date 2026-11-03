import { getPeopleInSharedScope } from "@/lib/immich/people";
import { resolveOperatorUserId } from "@/lib/immich/users";
import { loadShellContext } from "@/lib/server/shell-context";
import { PeopleWorkspace } from "@/components/people/people-workspace";

export default async function PeoplePage() {
  const shell = await loadShellContext();
  let initialPeople: Awaited<
    ReturnType<typeof getPeopleInSharedScope>
  >["people"] = [];
  let initialSharedAlbumIds: string[] = [];
  let loadError: string | null = null;

  try {
    const operatorUserId = await resolveOperatorUserId();
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
    />
  );
}
