import "server-only";
import { z } from "zod";
import { DEFAULT_SCAN_DPI } from "@/lib/assets/compute-context";
import {
  shareRoleSchema,
  type AlbumShareRole,
  type ConfigFieldSource,
  type ConfigSources,
} from "@/lib/config/admin-settings-schema";
import { readLocalConfigFile } from "@/lib/config/local-config";

export type CuratorEnv = {
  immichServerUrl: string;
  apiKey: string;
  operatorApiKey: string | undefined;
  adminApiKey: string | undefined;
  defaultAlbumId: string | undefined;
  operatorEmail: string | undefined;
  operatorUserId: string | undefined;
  targetEmail: string | undefined;
  defaultShareRole: AlbumShareRole;
  scanDefaultDpi: number;
  immichLibraryRoot: string | undefined;
};

const mergedConfigSchema = z.object({
  immichServerUrl: z.string().url(),
  apiKey: z.string().min(1),
  operatorApiKey: z.string().min(1).optional(),
  adminApiKey: z.string().min(1).optional(),
  defaultAlbumId: z.string().uuid().optional(),
  operatorEmail: z.string().email().optional(),
  operatorUserId: z.string().uuid().optional(),
  targetEmail: z.string().email().optional(),
  defaultShareRole: shareRoleSchema.optional(),
  scanDefaultDpi: z.number().int().min(1).max(9600).optional(),
  immichLibraryRoot: z.string().min(1).optional(),
});

function envString(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

function sourceOf(
  envVal: string | undefined,
  fileVal: string | undefined,
): ConfigFieldSource | "unset" {
  if (envVal && fileVal) return "both";
  if (envVal) return "env";
  if (fileVal) return "file";
  return "unset";
}

export function getConfigSources(): ConfigSources {
  const file = readLocalConfigFile();
  const envDefaultAlbum =
    envString("CURATOR_DEFAULT_ALBUM_ID") ?? envString("POUNDSGATE_ALBUM_ID");
  const fileDefaultAlbum = file.defaultAlbumId;

  return {
    immichServerUrl: sourceOf(
      envString("IMMICH_SERVER_URL"),
      file.immichServerUrl,
    ),
    targetApiKey: sourceOf(envString("IMMICH_API_KEY"), file.targetApiKey),
    operatorApiKey: sourceOf(
      envString("IMMICH_OPERATOR_API_KEY"),
      file.operatorApiKey,
    ),
    adminApiKey: sourceOf(
      envString("IMMICH_ADMIN_API_KEY"),
      file.adminApiKey,
    ),
    operatorEmail: sourceOf(
      envString("CURATOR_OPERATOR_EMAIL"),
      file.operatorEmail,
    ),
    operatorUserId: sourceOf(
      envString("CURATOR_OPERATOR_USER_ID"),
      file.operatorUserId,
    ),
    targetEmail: sourceOf(
      envString("CURATOR_TARGET_EMAIL"),
      file.targetEmail,
    ),
    defaultAlbumId: sourceOf(envDefaultAlbum, fileDefaultAlbum),
    defaultShareRole: sourceOf(
      envString("CURATOR_DEFAULT_SHARE_ROLE"),
      file.defaultShareRole,
    ),
    scanDefaultDpi: sourceOf(
      envString("CURATOR_SCAN_DEFAULT_DPI"),
      file.scanDefaultDpi != null ? String(file.scanDefaultDpi) : undefined,
    ),
    immichLibraryRoot: sourceOf(
      envString("IMMICH_LIBRARY_ROOT"),
      file.immichLibraryRoot,
    ),
  };
}

export function loadCuratorConfig(): CuratorEnv {
  const file = readLocalConfigFile();

  const immichServerUrl =
    envString("IMMICH_SERVER_URL") ?? file.immichServerUrl;
  const apiKey = envString("IMMICH_API_KEY") ?? file.targetApiKey;
  const operatorApiKey =
    envString("IMMICH_OPERATOR_API_KEY") ?? file.operatorApiKey;
  const adminApiKey = envString("IMMICH_ADMIN_API_KEY") ?? file.adminApiKey;
  const operatorEmail =
    envString("CURATOR_OPERATOR_EMAIL") ?? file.operatorEmail;
  const operatorUserId =
    envString("CURATOR_OPERATOR_USER_ID") ?? file.operatorUserId;
  const targetEmail = envString("CURATOR_TARGET_EMAIL") ?? file.targetEmail;
  const defaultAlbumId =
    envString("CURATOR_DEFAULT_ALBUM_ID") ??
    envString("POUNDSGATE_ALBUM_ID") ??
    file.defaultAlbumId;
  const defaultShareRole =
    (envString("CURATOR_DEFAULT_SHARE_ROLE") as AlbumShareRole | undefined) ??
    file.defaultShareRole;
  const scanDefaultDpiRaw =
    envString("CURATOR_SCAN_DEFAULT_DPI") ??
    (file.scanDefaultDpi != null ? String(file.scanDefaultDpi) : undefined);
  const scanDefaultDpi = scanDefaultDpiRaw
    ? Number.parseInt(scanDefaultDpiRaw, 10)
    : DEFAULT_SCAN_DPI;
  const immichLibraryRootRaw =
    envString("IMMICH_LIBRARY_ROOT") ?? file.immichLibraryRoot;
  const immichLibraryRoot = immichLibraryRootRaw?.trim() || undefined;

  const parsed = mergedConfigSchema.safeParse({
    immichServerUrl,
    apiKey,
    operatorApiKey,
    adminApiKey,
    defaultAlbumId,
    operatorEmail,
    operatorUserId,
    targetEmail,
    defaultShareRole,
    scanDefaultDpi: Number.isFinite(scanDefaultDpi)
      ? scanDefaultDpi
      : DEFAULT_SCAN_DPI,
    immichLibraryRoot,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Curator configuration invalid (check .env.local or Admin settings): ${msg}`,
    );
  }

  const data = parsed.data;
  return {
    immichServerUrl: data.immichServerUrl.replace(/\/$/, ""),
    apiKey: data.apiKey,
    operatorApiKey: data.operatorApiKey,
    adminApiKey: data.adminApiKey,
    defaultAlbumId: data.defaultAlbumId,
    operatorEmail: data.operatorEmail,
    operatorUserId: data.operatorUserId,
    targetEmail: data.targetEmail,
    defaultShareRole: data.defaultShareRole ?? "editor",
    scanDefaultDpi: data.scanDefaultDpi ?? DEFAULT_SCAN_DPI,
    immichLibraryRoot: data.immichLibraryRoot,
  };
}

export function getCuratorEnv(): CuratorEnv {
  return loadCuratorConfig();
}

export function tryGetCuratorEnv(): CuratorEnv | null {
  try {
    return loadCuratorConfig();
  } catch {
    return null;
  }
}

export function hasOperatorApiKey(): boolean {
  const env = tryGetCuratorEnv();
  return Boolean(env?.operatorApiKey);
}

export function isEnvOverride(field: keyof ConfigSources): boolean {
  const sources = getConfigSources();
  const s = sources[field];
  return s === "env" || s === "both";
}
