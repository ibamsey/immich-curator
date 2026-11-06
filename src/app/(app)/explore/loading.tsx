import { connection } from "next/server";
import { loadShellContext } from "@/lib/server/shell-context";
import { ExploreFallback } from "./explore-fallback";

export default async function ExploreLoading() {
  await connection();
  const shell = await loadShellContext();
  return <ExploreFallback shell={shell} />;
}
