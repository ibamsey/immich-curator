import { Suspense } from "react";
import { loadShellContext } from "@/lib/server/shell-context";
import { AdminData } from "./admin-data";
import { AdminFallback } from "./admin-fallback";

export const instant = true;

export default async function AdminPage() {
  const shell = await loadShellContext();

  return (
    <Suspense fallback={<AdminFallback shell={shell} />}>
      <AdminData shell={shell} />
    </Suspense>
  );
}
