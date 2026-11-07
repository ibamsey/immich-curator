import { Suspense } from "react";
import { loadShellContext } from "@/lib/server/shell-context";
import { LocationsData } from "./locations-data";
import { LocationsFallback } from "./locations-fallback";

export const instant = true;

export default async function LocationsPage() {
  const shell = await loadShellContext();

  return (
    <Suspense fallback={<LocationsFallback shell={shell} />}>
      <LocationsData shell={shell} />
    </Suspense>
  );
}
