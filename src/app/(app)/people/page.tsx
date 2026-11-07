import { Suspense } from "react";
import { PeopleData } from "./people-data";
import { PeopleFallback } from "./people-fallback";

type PageProps = {
  searchParams: Promise<{ personId?: string; tab?: "faces" | "duplicates" | string }>;
};

export const instant = true;

/** Sync shell only: with `searchParams` + `instant`, do not await above Suspense. */
export default function PeoplePage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<PeopleFallback />}>
      <PeopleData searchParams={searchParams} />
    </Suspense>
  );
}
