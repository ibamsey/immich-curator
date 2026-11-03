import "server-only";
import {
  getConfigSources,
  loadCuratorConfig,
  tryGetCuratorEnv,
} from "@/lib/config/curator-config.server";
import { readLocalConfigFile, writeLocalConfigFile } from "@/lib/config/local-config";
import type {
  AdminSettingsPut,
  LocalConfigFile,
} from "@/lib/config/admin-settings-schema";
import { resolveOperatorUserId } from "@/lib/immich/users";
import { loadOperatorContext } from "@/lib/server/operator-context";
import { loadShellContext } from "@/lib/server/shell-context";
import type { ImmichUser } from "@/lib/immich/types";

export type SanitizedAdminSettings = {
  immichServerUrl: string | null;
  operatorEmail: string | null;
  operatorUserId: string | null;
  targetEmail: string | null;
  defaultAlbumId: string | null;
  defaultShareRole: string;
  keysConfigured: {
    target: boolean;
    operator: boolean;
    admin: boolean;
  };
  sources: ReturnType<typeof getConfigSources>;
  targetConnected: boolean;
  targetProfile: Pick<ImmichUser, "id" | "email" | "name"> | null;
  operatorConnected: boolean;
  operatorProfile: Pick<ImmichUser, "id" | "email" | "name"> | null;
};

async function fetchUsersMe(
  serverUrl: string,
  apiKey: string,
): Promise<ImmichUser> {
  const url = `${serverUrl.replace(/\/$/, "")}/api/users/me`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "x-api-key": apiKey },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Immich /users/me failed: ${res.status}`);
  }
  return res.json() as Promise<ImmichUser>;
}

export async function testImmichActor(
  actor: "target" | "operator",
): Promise<{ ok: true; user: ImmichUser } | { ok: false; error: string }> {
  try {
    const config = loadCuratorConfig();
    const apiKey =
      actor === "target" ? config.apiKey : config.operatorApiKey;
    if (!apiKey) {
      return { ok: false, error: `${actor} API key not configured` };
    }
    const user = await fetchUsersMe(config.immichServerUrl, apiKey);
    if (actor === "target" && config.targetEmail) {
      if (user.email.toLowerCase() !== config.targetEmail.toLowerCase()) {
        return {
          ok: false,
          error: `Target key email ${user.email} does not match expected ${config.targetEmail}`,
        };
      }
    }
    if (actor === "operator" && config.operatorEmail) {
      if (user.email.toLowerCase() !== config.operatorEmail.toLowerCase()) {
        return {
          ok: false,
          error: `Operator key email ${user.email} does not match expected ${config.operatorEmail}`,
        };
      }
    }
    return { ok: true, user };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Connection failed";
    return { ok: false, error: message };
  }
}

export async function buildSanitizedAdminSettings(): Promise<SanitizedAdminSettings> {
  const sources = getConfigSources();
  const env = tryGetCuratorEnv();
  const shell = await loadShellContext();
  const operatorCtx = await loadOperatorContext();
  const operatorUserId = env ? await resolveOperatorUserId() : null;

  let targetProfile: SanitizedAdminSettings["targetProfile"] = null;
  if (shell.connectionOk && env) {
    const test = await testImmichActor("target");
    if (test.ok) {
      targetProfile = {
        id: test.user.id,
        email: test.user.email,
        name: test.user.name,
      };
    }
  }

  let operatorProfile: SanitizedAdminSettings["operatorProfile"] = null;
  if (operatorCtx.connectionOk && operatorCtx.email) {
    const test = await testImmichActor("operator");
    if (test.ok) {
      operatorProfile = {
        id: test.user.id,
        email: test.user.email,
        name: test.user.name,
      };
    }
  }

  return {
    immichServerUrl: env?.immichServerUrl ?? null,
    operatorEmail: env?.operatorEmail ?? null,
    operatorUserId,
    targetEmail: env?.targetEmail ?? null,
    defaultAlbumId: env?.defaultAlbumId ?? null,
    defaultShareRole: env?.defaultShareRole ?? "editor",
    keysConfigured: {
      target: Boolean(env?.apiKey),
      operator: Boolean(env?.operatorApiKey),
      admin: Boolean(env?.adminApiKey),
    },
    sources,
    targetConnected: shell.connectionOk,
    targetProfile,
    operatorConnected: operatorCtx.connectionOk,
    operatorProfile,
  };
}

function applyPutToFile(
  current: LocalConfigFile,
  body: AdminSettingsPut,
): LocalConfigFile {
  const next: LocalConfigFile = { ...current };
  const sources = getConfigSources();

  if (
    body.immichServerUrl !== undefined &&
    sources.immichServerUrl !== "env" &&
    sources.immichServerUrl !== "both"
  ) {
    next.immichServerUrl = body.immichServerUrl;
  }

  if (body.clearTargetApiKey && sources.targetApiKey === "file") {
    delete next.targetApiKey;
  } else if (
    body.targetApiKey &&
    body.targetApiKey.trim() !== "" &&
    sources.targetApiKey !== "env" &&
    sources.targetApiKey !== "both"
  ) {
    next.targetApiKey = body.targetApiKey.trim();
  }

  if (body.clearOperatorApiKey && sources.operatorApiKey === "file") {
    delete next.operatorApiKey;
  } else if (
    body.operatorApiKey &&
    body.operatorApiKey.trim() !== "" &&
    sources.operatorApiKey !== "env" &&
    sources.operatorApiKey !== "both"
  ) {
    next.operatorApiKey = body.operatorApiKey.trim();
  }

  if (body.clearAdminApiKey && sources.adminApiKey === "file") {
    delete next.adminApiKey;
  } else if (
    body.adminApiKey &&
    body.adminApiKey.trim() !== "" &&
    sources.adminApiKey !== "env" &&
    sources.adminApiKey !== "both"
  ) {
    next.adminApiKey = body.adminApiKey.trim();
  }

  if (
    body.operatorEmail !== undefined &&
    sources.operatorEmail !== "env" &&
    sources.operatorEmail !== "both"
  ) {
    if (body.operatorEmail === "") delete next.operatorEmail;
    else next.operatorEmail = body.operatorEmail;
  }

  if (
    body.operatorUserId !== undefined &&
    sources.operatorUserId !== "env" &&
    sources.operatorUserId !== "both"
  ) {
    if (body.operatorUserId === "") delete next.operatorUserId;
    else next.operatorUserId = body.operatorUserId;
  }

  if (
    body.targetEmail !== undefined &&
    sources.targetEmail !== "env" &&
    sources.targetEmail !== "both"
  ) {
    if (body.targetEmail === "") delete next.targetEmail;
    else next.targetEmail = body.targetEmail;
  }

  if (
    body.defaultAlbumId !== undefined &&
    sources.defaultAlbumId !== "env" &&
    sources.defaultAlbumId !== "both"
  ) {
    if (body.defaultAlbumId === "") delete next.defaultAlbumId;
    else next.defaultAlbumId = body.defaultAlbumId;
  }

  if (
    body.defaultShareRole !== undefined &&
    sources.defaultShareRole !== "env" &&
    sources.defaultShareRole !== "both"
  ) {
    next.defaultShareRole = body.defaultShareRole;
  }

  return next;
}

export async function applyAdminSettingsPut(
  body: AdminSettingsPut,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = readLocalConfigFile();
  const next = applyPutToFile(current, body);

  const targetKeySource = getConfigSources().targetApiKey;
  if (
    body.targetApiKey?.trim() &&
    targetKeySource !== "env" &&
    targetKeySource !== "both"
  ) {
    const url =
      envString("IMMICH_SERVER_URL") ??
      next.immichServerUrl ??
      current.immichServerUrl;
    if (!url) {
      return { ok: false, error: "Set Immich server URL before target API key" };
    }
    const test = await fetchUsersMe(url, body.targetApiKey.trim());
    const expected =
      body.targetEmail ??
      next.targetEmail ??
      envString("CURATOR_TARGET_EMAIL");
    if (expected && test.email.toLowerCase() !== expected.toLowerCase()) {
      return {
        ok: false,
        error: `Target key email does not match expected ${expected}`,
      };
    }
  }

  const opKeySource = getConfigSources().operatorApiKey;
  if (
    body.operatorApiKey?.trim() &&
    opKeySource !== "env" &&
    opKeySource !== "both"
  ) {
    const url =
      envString("IMMICH_SERVER_URL") ??
      next.immichServerUrl ??
      current.immichServerUrl;
    if (!url) {
      return {
        ok: false,
        error: "Set Immich server URL before operator API key",
      };
    }
    const test = await fetchUsersMe(url, body.operatorApiKey.trim());
    const expected =
      body.operatorEmail ??
      next.operatorEmail ??
      envString("CURATOR_OPERATOR_EMAIL");
    if (expected && test.email.toLowerCase() !== expected.toLowerCase()) {
      return {
        ok: false,
        error: `Operator key email does not match expected ${expected}`,
      };
    }
  }

  writeLocalConfigFile(next);

  try {
    loadCuratorConfig();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid configuration";
    writeLocalConfigFile(current);
    return { ok: false, error: message };
  }

  return { ok: true };
}

function envString(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() !== "" ? v.trim() : undefined;
}
