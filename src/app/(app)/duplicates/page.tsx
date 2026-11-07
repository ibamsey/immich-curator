import { Suspense } from "react";
import { loadShellContext } from "@/lib/server/shell-context";
import { DuplicatesData } from "./duplicates-data";
import { DuplicatesFallback } from "./duplicates-fallback";

export const instant = true;

export default async function DuplicatesPage() {
  const shell = await loadShellContext();

  return (
    <Suspense fallback={<DuplicatesFallback shell={shell} />}>
      <DuplicatesData shell={shell} />
    </Suspense>
  );
}
