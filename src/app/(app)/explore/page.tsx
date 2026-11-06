import { Suspense } from "react";
import { connection } from "next/server";
import { loadShellContext } from "@/lib/server/shell-context";
import { ExploreData } from "./explore-data";
import { ExploreFallback } from "./explore-fallback";

type PageProps = {
  searchParams: Promise<{ assetId?: string; albumId?: string }>;
};

export default async function ExplorePage({ searchParams }: PageProps) {
  await connection();
  const shell = await loadShellContext();
  const params = await searchParams;

  return (
    <Suspense fallback={<ExploreFallback shell={shell} />}>
      <ExploreData
        shell={shell}
        assetId={params.assetId}
        albumId={params.albumId}
      />
    </Suspense>
  );
}
