import { Suspense } from "react";
import { loadShellContext } from "@/lib/server/shell-context";
import { AlbumsData } from "./albums-data";
import { AlbumsFallback } from "./albums-fallback";

export const instant = true;

export default async function AlbumsPage() {
  const shell = await loadShellContext();

  return (
    <Suspense fallback={<AlbumsFallback shell={shell} />}>
      <AlbumsData shell={shell} />
    </Suspense>
  );
}
