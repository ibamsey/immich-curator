/** Server-only curator config (env + `.curator/config.local.json`). */
export {
  getCuratorEnv,
  tryGetCuratorEnv,
  loadCuratorConfig,
  hasOperatorApiKey,
  getConfigSources,
  isEnvOverride,
  type CuratorEnv,
} from "@/lib/config/curator-config.server";

export type { AlbumShareRole } from "@/lib/config/admin-settings-schema";
