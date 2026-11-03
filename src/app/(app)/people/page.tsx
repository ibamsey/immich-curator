import { loadShellContext } from "@/lib/server/shell-context";
import { StubPage } from "@/components/stub-page";

export default async function PeoplePage() {
  const shell = await loadShellContext();
  return <StubPage shell={shell} title="People" />;
}
