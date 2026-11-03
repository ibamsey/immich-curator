import { getCuratorEnv } from "@/lib/config/env";
import { immichFetch } from "@/lib/immich/client";
import { getCurrentUser } from "@/lib/immich/assets";

export type ShellContext = {
  connectionOk: boolean;
  targetEmail: string | null;
};

export async function loadShellContext(): Promise<ShellContext> {
  try {
    getCuratorEnv();
    const ping = await immichFetch("/api/server/ping");
    if (!ping.ok) {
      return { connectionOk: false, targetEmail: null };
    }
    const user = await getCurrentUser();
    return { connectionOk: true, targetEmail: user.email };
  } catch {
    return { connectionOk: false, targetEmail: null };
  }
}
