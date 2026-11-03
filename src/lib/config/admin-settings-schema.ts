import { z } from "zod";

export const shareRoleSchema = z.enum(["editor", "viewer"]);
export type AlbumShareRole = z.infer<typeof shareRoleSchema>;

export const localConfigFileSchema = z.object({
  immichServerUrl: z.string().url().optional(),
  targetApiKey: z.string().min(1).optional(),
  operatorApiKey: z.string().min(1).optional(),
  adminApiKey: z.string().min(1).optional(),
  operatorEmail: z.string().email().optional(),
  operatorUserId: z.string().uuid().optional(),
  targetEmail: z.string().email().optional(),
  defaultAlbumId: z.string().uuid().optional(),
  defaultShareRole: shareRoleSchema.optional(),
});

export type LocalConfigFile = z.infer<typeof localConfigFileSchema>;

/** Partial PUT from Admin UI; empty strings for keys mean "unchanged". */
export const adminSettingsPutSchema = z.object({
  immichServerUrl: z.string().url().optional(),
  targetApiKey: z.string().optional(),
  operatorApiKey: z.string().optional(),
  adminApiKey: z.string().optional(),
  operatorEmail: z.string().email().optional().or(z.literal("")),
  operatorUserId: z.string().uuid().optional().or(z.literal("")),
  targetEmail: z.string().email().optional().or(z.literal("")),
  defaultAlbumId: z.string().uuid().optional().or(z.literal("")),
  defaultShareRole: shareRoleSchema.optional(),
  clearTargetApiKey: z.boolean().optional(),
  clearOperatorApiKey: z.boolean().optional(),
  clearAdminApiKey: z.boolean().optional(),
});

export type AdminSettingsPut = z.infer<typeof adminSettingsPutSchema>;

export const testConnectionSchema = z.object({
  actor: z.enum(["target", "operator", "both"]).optional(),
});

export type ConfigFieldSource = "env" | "file" | "both";

export type ConfigSources = {
  immichServerUrl: ConfigFieldSource | "unset";
  targetApiKey: ConfigFieldSource | "unset";
  operatorApiKey: ConfigFieldSource | "unset";
  adminApiKey: ConfigFieldSource | "unset";
  operatorEmail: ConfigFieldSource | "unset";
  operatorUserId: ConfigFieldSource | "unset";
  targetEmail: ConfigFieldSource | "unset";
  defaultAlbumId: ConfigFieldSource | "unset";
  defaultShareRole: ConfigFieldSource | "unset";
};
