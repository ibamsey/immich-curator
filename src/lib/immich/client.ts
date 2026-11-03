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

export async function immichFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const env = getCuratorEnv();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${env.immichServerUrl}${normalized}`;
  const headers = new Headers(init?.headers);
  headers.set("x-api-key", env.apiKey);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { cache: "no-store", ...init, headers });
}

export async function immichJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await immichFetch(path, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ImmichApiError(
      text || `Immich request failed: ${res.status}`,
      res.status,
    );
  }
  return res.json() as Promise<T>;
}
