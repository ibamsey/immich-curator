import { cacheLife } from "next/cache";
import { getCuratorEnv } from "@/lib/config/env";
import { immichFetch } from "@/lib/immich/client";
import { getCurrentUser } from "@/lib/immich/assets";

export type ShellContext = {
  connectionOk: boolean;
  targetEmail: string | null;
};

/**
 * Cached for Cache Components / partial prefetch: avoids "uncached data during navigation"
 * while keeping ping + user fresh (short `seconds` profile).
 */
export async function loadShellContext(): Promise<ShellContext> {
  "use cache";
  cacheLife("seconds");

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
