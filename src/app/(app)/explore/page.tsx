import { Suspense } from "react";
import { ExploreData } from "./explore-data";
import { ExploreFallback } from "./explore-fallback";

type PageProps = {
  searchParams: Promise<{ assetId?: string; albumId?: string }>;
};

export const instant = true;

/** Sync shell only: with `searchParams` + `instant`, do not await above Suspense. */
export default function ExplorePage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<ExploreFallback />}>
      <ExploreData searchParams={searchParams} />
    </Suspense>
  );
}
