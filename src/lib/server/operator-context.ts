import { getCuratorEnv, tryGetCuratorEnv } from "@/lib/config/env";
import { immichFetchOperator } from "@/lib/immich/client";
import type { ImmichUser } from "@/lib/immich/types";

export type OperatorContext = {
  configured: boolean;
  connectionOk: boolean;
  email: string | null;
};

export async function loadOperatorContext(): Promise<OperatorContext> {
  const env = tryGetCuratorEnv();
  if (!env?.operatorApiKey) {
    return { configured: false, connectionOk: false, email: null };
  }
  try {
    getCuratorEnv();
    const ping = await immichFetchOperator("/api/server/ping");
    if (!ping.ok) {
      return { configured: true, connectionOk: false, email: null };
    }
    const res = await immichFetchOperator("/api/users/me");
    if (!res.ok) {
      return { configured: true, connectionOk: false, email: null };
    }
    const user = (await res.json()) as ImmichUser;
    if (
      env.operatorEmail &&
      user.email.toLowerCase() !== env.operatorEmail.toLowerCase()
    ) {
      return { configured: true, connectionOk: false, email: user.email };
    }
    return { configured: true, connectionOk: true, email: user.email };
  } catch {
    return { configured: true, connectionOk: false, email: null };
  }
}
