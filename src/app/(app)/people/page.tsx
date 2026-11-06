import { Suspense } from "react";
import { loadShellContext } from "@/lib/server/shell-context";
import { PeopleData } from "./people-data";
import { PeopleFallback } from "./people-fallback";

type PageProps = {
  searchParams: Promise<{ personId?: string; tab?: "faces" | "duplicates" | string }>;
};

export default async function PeoplePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialPersonId = params.personId?.trim() || null;
  const shell = await loadShellContext();

  return (
    <Suspense fallback={<PeopleFallback shell={shell} />}>
      <PeopleData
        shell={shell}
        initialPersonId={initialPersonId}
        requestedTab={params.tab}
      />
    </Suspense>
  );
}
