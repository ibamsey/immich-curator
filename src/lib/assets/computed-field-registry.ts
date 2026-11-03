import type { ComputeContext } from "@/lib/assets/compute-context";
import type { GridAsset } from "@/lib/assets/grid-asset";
import {
  computePhysicalSizeMm,
  formatAreaMm2,
  formatMm,
  formatPhysicalSizeLabel,
} from "@/lib/assets/physical-size";

export type ComputedFieldDescriptor = {
  id: string;
  label: string;
  valueType: "number" | "string";
  compute: (
    asset: GridAsset,
    ctx: ComputeContext,
  ) => string | number | null;
  formatDisplay?: (value: string | number) => string;
};

function physicalSize(asset: GridAsset, ctx: ComputeContext) {
  return computePhysicalSizeMm(
    asset,
    ctx.defaultScanDpi,
    ctx.fileResolution,
  );
}

export const COMPUTED_FIELDS: ComputedFieldDescriptor[] = [
  {
    id: "physicalWidthMm",
    label: "Physical width (mm)",
    valueType: "number",
    compute: (asset, ctx) => {
      const s = physicalSize(asset, ctx);
      return s ? Math.round(s.widthMm * 10) / 10 : null;
    },
    formatDisplay: (v) => `${formatMm(Number(v))} mm`,
  },
  {
    id: "physicalHeightMm",
    label: "Physical height (mm)",
    valueType: "number",
    compute: (asset, ctx) => {
      const s = physicalSize(asset, ctx);
      return s ? Math.round(s.heightMm * 10) / 10 : null;
    },
    formatDisplay: (v) => `${formatMm(Number(v))} mm`,
  },
  {
    id: "physicalAreaMm2",
    label: "Area (mm²)",
    valueType: "number",
    compute: (asset, ctx) => {
      const s = physicalSize(asset, ctx);
      return s ? Math.round(s.areaMm2) : null;
    },
    formatDisplay: (v) => formatAreaMm2(Number(v)),
  },
  {
    id: "physicalSizeLabel",
    label: "Physical size",
    valueType: "string",
    compute: (asset, ctx) => {
      const s = physicalSize(asset, ctx);
      return s ? formatPhysicalSizeLabel(s) : null;
    },
  },
];

const computedMap = new Map(COMPUTED_FIELDS.map((f) => [f.id, f]));

export function getComputedField(
  id: string,
): ComputedFieldDescriptor | undefined {
  return computedMap.get(id);
}

export function isComputedFieldId(id: string): boolean {
  return computedMap.has(id);
}

export function computeFieldValue(
  asset: GridAsset,
  fieldId: string,
  ctx: ComputeContext,
): string | number | null {
  const field = computedMap.get(fieldId);
  if (!field) return null;
  return field.compute(asset, ctx);
}

export function formatComputedDisplay(
  fieldId: string,
  value: string | number,
): string {
  const field = computedMap.get(fieldId);
  if (field?.formatDisplay) return field.formatDisplay(value);
  return String(value);
}
