import { cacheLife } from "next/cache";
import { getCuratorEnv } from "@/lib/config/env";
import { immichJson } from "@/lib/immich/client";
import type { ImmichUser } from "@/lib/immich/types";

async function fetchAllUsers(apiKey: string): Promise<ImmichUser[]> {
  const env = getCuratorEnv();
  const url = `${env.immichServerUrl}/api/users`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "x-api-key": apiKey },
  });
  if (!res.ok) {
    throw new Error(`User list failed: ${res.status}`);
  }
  return res.json() as Promise<ImmichUser[]>;
}

async function resolveOperatorUserIdUncached(): Promise<string | null> {
  const env = getCuratorEnv();
  if (env.operatorUserId) {
    return env.operatorUserId;
  }
  if (!env.operatorEmail) {
    return null;
  }
  const lookupKey = env.adminApiKey ?? env.apiKey;
  try {
    const users = await fetchAllUsers(lookupKey);
    const match = users.find(
      (u) => u.email.toLowerCase() === env.operatorEmail!.toLowerCase(),
    );
    return match?.id ?? null;
  } catch {
    if (env.adminApiKey && env.adminApiKey !== env.apiKey) {
      return null;
    }
    return null;
  }
}

/**
 * Resolve curator operator Immich user id (env id, or email via admin key).
 * Use in Route Handlers and other non–Cache Components contexts.
 */
export async function resolveOperatorUserId(): Promise<string | null> {
  return resolveOperatorUserIdUncached();
}

/**
 * Same as {@link resolveOperatorUserId}, but cached briefly for **app pages**
 * using Cache Components / partial prefetch. Using the uncached version from a
 * `"use cache"` layout/shell tree triggers “uncached data during navigation”.
 * Do **not** call this from Route Handlers (prerender cache-miss risk).
 */
export async function resolveOperatorUserIdCached(): Promise<string | null> {
  "use cache";
  cacheLife("seconds");
  return resolveOperatorUserIdUncached();
}

export async function getUserById(userId: string): Promise<ImmichUser | null> {
  try {
    return await immichJson<ImmichUser>(`/api/users/${userId}`);
  } catch {
    return null;
  }
}
