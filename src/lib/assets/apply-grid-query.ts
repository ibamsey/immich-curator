import { getField } from "@/lib/assets/asset-field-registry";
import {
  defaultComputeContext,
  type ComputeContext,
} from "@/lib/assets/compute-context";
import { getGridFieldValue } from "@/lib/assets/grid-field-value";
import type { GridAsset } from "@/lib/assets/grid-asset";
import { formatAreaMm2 } from "@/lib/assets/physical-size";
import type {
  AssetQueryGroup,
  GridFilterRule,
  GridQuery,
} from "@/lib/assets/grid-query-types";

function compareValues(
  a: string | number | boolean | null,
  b: string | number | boolean | null,
): number {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
}

function ruleMatches(
  asset: GridAsset,
  rule: GridFilterRule,
  ctx: ComputeContext,
): boolean {
  const raw = getGridFieldValue(asset, rule.fieldId, ctx);
  const op = rule.op;

  if (op === "empty") {
    return raw === "" || raw === null || raw === false;
  }
  if (op === "notEmpty") {
    return !(raw === "" || raw === null || raw === false);
  }

  if (rule.fieldId.startsWith("has") && typeof raw === "boolean") {
    const want = rule.value !== false;
    return op === "eq" ? raw === want : raw !== want;
  }

  if (op === "eq") return raw === rule.value;
  if (op === "neq") return raw !== rule.value;
  if (op === "contains" && typeof raw === "string") {
    return raw.toLowerCase().includes(String(rule.value ?? "").toLowerCase());
  }
  if (op === "gt" || op === "lt") {
    const a = typeof raw === "number" ? raw : Date.parse(String(raw));
    const b =
      typeof rule.value === "number"
        ? rule.value
        : Date.parse(String(rule.value ?? ""));
    if (Number.isNaN(a) || Number.isNaN(b)) return true;
    return op === "gt" ? a > b : a < b;
  }
  return true;
}

export function applyClientFilters(
  assets: GridAsset[],
  rules: GridFilterRule[],
  ctx: ComputeContext = defaultComputeContext(),
): GridAsset[] {
  const clientRules = rules.filter((r) => {
    const f = getField(r.fieldId);
    return f?.clientOnly || !f?.immich?.searchKey;
  });
  if (clientRules.length === 0) return assets;
  return assets.filter((a) =>
    clientRules.every((r) => ruleMatches(a, r, ctx)),
  );
}

export function sortGridAssets(
  assets: GridAsset[],
  fieldId: string,
  direction: "asc" | "desc",
  ctx: ComputeContext = defaultComputeContext(),
): GridAsset[] {
  const sorted = [...assets].sort((x, y) => {
    const cmp = compareValues(
      getGridFieldValue(x, fieldId, ctx),
      getGridFieldValue(y, fieldId, ctx),
    );
    return direction === "asc" ? cmp : -cmp;
  });
  return sorted;
}

function isChronologicalGroupField(fieldId: string): boolean {
  return (
    fieldId === "month" ||
    fieldId === "captureDate" ||
    fieldId === "localDateTime" ||
    fieldId === "fileCreatedAt"
  );
}

function groupLabel(fieldId: string, key: string): string {
  if (fieldId === "captureDate" && key) {
    const parts = key.split("-").map((p) => Number(p));
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      const dt = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
      return dt.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }
  if (fieldId === "month" && key) {
    const [y, m] = key.split("-");
    if (y && m) {
      const dt = new Date(Number(y), Number(m) - 1, 1);
      return dt.toLocaleString(undefined, { month: "long", year: "numeric" });
    }
  }
  if (fieldId === "physicalAreaMm2" && key) {
    const n = Number(key);
    if (!Number.isNaN(n)) return formatAreaMm2(n);
  }
  if (!key) return "Unknown";
  return key;
}

export function groupGridAssets(
  assets: GridAsset[],
  groupBy: string,
  sortFieldId: string,
  sortDirection: "asc" | "desc",
  ctx: ComputeContext = defaultComputeContext(),
): AssetQueryGroup[] {
  const fieldId =
    groupBy === "localDateTime" || groupBy === "captureDate"
      ? "captureDate"
      : groupBy === "month"
        ? "month"
        : groupBy;
  const buckets = new Map<string, GridAsset[]>();

  for (const asset of assets) {
    const key = String(getGridFieldValue(asset, fieldId, ctx) ?? "") || "—";
    const list = buckets.get(key) ?? [];
    list.push(asset);
    buckets.set(key, list);
  }

  const groups: AssetQueryGroup[] = [...buckets.entries()]
    .sort(([a], [b]) => {
      const cmp = compareValues(a, b);
      if (isChronologicalGroupField(fieldId)) {
        return sortDirection === "desc" ? -cmp : cmp;
      }
      return cmp;
    })
    .map(([key, list]) => ({
      key,
      label: groupLabel(fieldId, key === "—" ? "" : key),
      assets: sortGridAssets(list, sortFieldId, sortDirection, ctx),
    }));

  return groups;
}

export function applyClientQueryPhase(
  assets: GridAsset[],
  query: GridQuery,
  clientFilterRules: GridFilterRule[],
  ctx: ComputeContext = defaultComputeContext(),
): { assets: GridAsset[]; groups: AssetQueryGroup[] | null } {
  let list = applyClientFilters(assets, clientFilterRules, ctx);

  const field = getField(query.sort.fieldId);
  if (field?.clientOnly || !field?.immich?.sortBy) {
    list = sortGridAssets(list, query.sort.fieldId, query.sort.direction, ctx);
  }

  if (query.groupBy) {
    return {
      assets: list,
      groups: groupGridAssets(
        list,
        query.groupBy,
        query.sort.fieldId,
        query.sort.direction,
        ctx,
      ),
    };
  }

  return { assets: list, groups: null };
}

/** Preset filter definitions for toolbar chips. */
export const GRID_QUERY_PRESETS: Record<
  string,
  { label: string; filters: GridFilterRule[] }
> = {
  noDescription: {
    label: "No description",
    filters: [{ fieldId: "hasDescription", op: "eq", value: false }],
  },
  noLocation: {
    label: "No location",
    filters: [{ fieldId: "hasLocation", op: "eq", value: false }],
  },
  untagged: {
    label: "Untagged",
    filters: [{ fieldId: "hasTags", op: "eq", value: false }],
  },
  favorites: {
    label: "Favorites",
    filters: [{ fieldId: "isFavorite", op: "eq", value: true }],
  },
  imagesOnly: {
    label: "Images",
    filters: [{ fieldId: "type", op: "eq", value: "IMAGE" }],
  },
  videosOnly: {
    label: "Videos",
    filters: [{ fieldId: "type", op: "eq", value: "VIDEO" }],
  },
};
