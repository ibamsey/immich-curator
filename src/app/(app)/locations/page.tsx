import { loadShellContext } from "@/lib/server/shell-context";
import { StubPage } from "@/components/stub-page";

export default async function LocationsPage() {
  const shell = await loadShellContext();
  return <StubPage shell={shell} title="Locations" />;
}
