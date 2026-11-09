export type SortDirection = "asc" | "desc";

export type FilterOp =
  | "eq"
  | "neq"
  | "contains"
  | "empty"
  | "notEmpty"
  | "gt"
  | "lt";

export type GridFilterRule = {
  fieldId: string;
  op: FilterOp;
  value?: string | number | boolean;
};

export type GridQuery = {
  sort: { fieldId: string; direction: SortDirection };
  filters: GridFilterRule[];
  groupBy: string | null;
};

export type GridQueryScope =
  | { mode: "album"; albumId: string }
  | { mode: "personShared"; personId: string };

export const DEFAULT_GRID_QUERY: GridQuery = {
  sort: { fieldId: "localDateTime", direction: "desc" },
  filters: [],
  groupBy: null,
};

/** Explore album grid: sections per capture day, newest days first. */
export const EXPLORE_GRID_QUERY: GridQuery = {
  sort: { fieldId: "localDateTime", direction: "desc" },
  filters: [],
  groupBy: "captureDate",
};

export type AssetQueryGroup = {
  key: string;
  label: string;
  assets: import("@/lib/assets/grid-asset").GridAsset[];
};

export type AssetQueryResult = {
  assets: import("@/lib/assets/grid-asset").GridAsset[];
  total: number;
  groups: AssetQueryGroup[] | null;
};
