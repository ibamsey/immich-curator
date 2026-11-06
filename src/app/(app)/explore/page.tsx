import { Suspense } from "react";
import { loadShellContext } from "@/lib/server/shell-context";
import { ExploreData } from "./explore-data";
import { ExploreFallback } from "./explore-fallback";

type PageProps = {
  searchParams: Promise<{ assetId?: string; albumId?: string }>;
};

export default async function ExplorePage({ searchParams }: PageProps) {
  const shell = await loadShellContext();

  return (
    <Suspense fallback={<ExploreFallback shell={shell} />}>
      <ExploreData shell={shell} searchParams={searchParams} />
    </Suspense>
  );
}
