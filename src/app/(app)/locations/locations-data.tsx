import { StubPage } from "@/components/stub-page";
import type { ShellContext } from "@/lib/server/shell-context";

type LocationsDataProps = {
  shell: ShellContext;
};

export async function LocationsData({ shell }: LocationsDataProps) {
  return <StubPage shell={shell} title="Locations" />;
}
