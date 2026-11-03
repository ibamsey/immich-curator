import { getCuratorEnv } from "@/lib/config/env";

export class ImmichApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ImmichApiError";
  }
}

export type ImmichActor = "target" | "operator";

async function immichFetchWithKey(
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const env = getCuratorEnv();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${env.immichServerUrl}${normalized}`;
  const headers = new Headers(init?.headers);
  headers.set("x-api-key", apiKey);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { cache: "no-store", ...init, headers });
}

export async function immichFetchTarget(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const env = getCuratorEnv();
  return immichFetchWithKey(env.apiKey, path, init);
}

export async function immichFetchOperator(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const env = getCuratorEnv();
  if (!env.operatorApiKey) {
    throw new ImmichApiError(
      "IMMICH_OPERATOR_API_KEY not configured for operator actions",
      503,
    );
  }
  return immichFetchWithKey(env.operatorApiKey, path, init);
}

/** Target library owner (default). */
export async function immichFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return immichFetchTarget(path, init);
}

async function immichJsonWithFetch<T>(
  fetchFn: (path: string, init?: RequestInit) => Promise<Response>,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetchFn(path, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ImmichApiError(
      text || `Immich request failed: ${res.status}`,
      res.status,
    );
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export async function immichJsonTarget<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  return immichJsonWithFetch<T>(immichFetchTarget, path, init);
}

export async function immichJsonOperator<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  return immichJsonWithFetch<T>(immichFetchOperator, path, init);
}

export async function immichJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  return immichJsonTarget<T>(path, init);
}
