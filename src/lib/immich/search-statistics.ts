import { immichJson } from "@/lib/immich/client";

export type StatisticsSearchBody = Record<string, unknown>;

export async function getSearchStatisticsTotal(
  body: StatisticsSearchBody,
): Promise<number> {
  const data = await immichJson<{ total: number }>("/api/search/statistics", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.total ?? 0;
}
