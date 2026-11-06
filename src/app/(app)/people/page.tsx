import { Suspense } from "react";
import { loadShellContext } from "@/lib/server/shell-context";
import { PeopleData } from "./people-data";
import { PeopleFallback } from "./people-fallback";

type PageProps = {
  searchParams: Promise<{ personId?: string; tab?: "faces" | "duplicates" | string }>;
};

export default async function PeoplePage({ searchParams }: PageProps) {
  const shell = await loadShellContext();

  return (
    <Suspense fallback={<PeopleFallback shell={shell} />}>
      <PeopleData shell={shell} searchParams={searchParams} />
    </Suspense>
  );
}
