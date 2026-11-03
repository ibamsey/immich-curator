import "server-only";
import fs from "fs";
import path from "path";
import {
  localConfigFileSchema,
  type LocalConfigFile,
} from "@/lib/config/admin-settings-schema";

const CONFIG_DIR = path.join(process.cwd(), ".curator");
export const LOCAL_CONFIG_PATH = path.join(CONFIG_DIR, "config.local.json");

export function readLocalConfigFile(): LocalConfigFile {
  try {
    const raw = fs.readFileSync(LOCAL_CONFIG_PATH, "utf8");
    const json: unknown = JSON.parse(raw);
    const parsed = localConfigFileSchema.safeParse(json);
    if (!parsed.success) {
      return {};
    }
    return parsed.data;
  } catch {
    return {};
  }
}

export function writeLocalConfigFile(config: LocalConfigFile): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  const payload = JSON.stringify(config, null, 2) + "\n";
  fs.writeFileSync(LOCAL_CONFIG_PATH, payload, { mode: 0o600 });
  try {
    fs.chmodSync(LOCAL_CONFIG_PATH, 0o600);
  } catch {
    /* ignore on platforms without chmod */
  }
}