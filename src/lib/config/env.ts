import { z } from "zod";

const shareRoleSchema = z.enum(["editor", "viewer"]);

const envSchema = z.object({
  IMMICH_SERVER_URL: z.string().url(),
  IMMICH_API_KEY: z.string().min(1),
  IMMICH_ADMIN_API_KEY: z.string().min(1).optional(),
  CURATOR_DEFAULT_ALBUM_ID: z.string().uuid().optional(),
  POUNDSGATE_ALBUM_ID: z.string().uuid().optional(),
  CURATOR_OPERATOR_EMAIL: z.string().email().optional(),
  CURATOR_OPERATOR_USER_ID: z.string().uuid().optional(),
  CURATOR_TARGET_EMAIL: z.string().email().optional(),
  CURATOR_DEFAULT_SHARE_ROLE: shareRoleSchema.optional(),
});

export type AlbumShareRole = z.infer<typeof shareRoleSchema>;

export type CuratorEnv = {
  immichServerUrl: string;
  apiKey: string;
  adminApiKey: string | undefined;
  defaultAlbumId: string | undefined;
  operatorEmail: string | undefined;
  operatorUserId: string | undefined;
  targetEmail: string | undefined;
  defaultShareRole: AlbumShareRole;
};

export function getCuratorEnv(): CuratorEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Curator configuration invalid (check .env.local): ${msg}`,
    );
  }
  const data = parsed.data;
  const defaultAlbumId =
    data.CURATOR_DEFAULT_ALBUM_ID ?? data.POUNDSGATE_ALBUM_ID;
  return {
    immichServerUrl: data.IMMICH_SERVER_URL.replace(/\/$/, ""),
    apiKey: data.IMMICH_API_KEY,
    adminApiKey: data.IMMICH_ADMIN_API_KEY,
    defaultAlbumId,
    operatorEmail: data.CURATOR_OPERATOR_EMAIL,
    operatorUserId: data.CURATOR_OPERATOR_USER_ID,
    targetEmail: data.CURATOR_TARGET_EMAIL,
    defaultShareRole: data.CURATOR_DEFAULT_SHARE_ROLE ?? "editor",
  };
}

export function tryGetCuratorEnv(): CuratorEnv | null {
  try {
    return getCuratorEnv();
  } catch {
    return null;
  }
}
