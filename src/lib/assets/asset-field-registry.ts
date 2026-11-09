export type FieldValueType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "enum"
  | "string[]";

export type AssetFieldDescriptor = {
  id: string;
  label: string;
  valueType: FieldValueType;
  capabilities: { sort: boolean; filter: boolean; group: boolean };
  immich?: { searchKey?: string; sortBy?: string };
  clientOnly?: boolean;
};

export const ASSET_FIELDS: AssetFieldDescriptor[] = [
  {
    id: "localDateTime",
    label: "Captured date",
    valueType: "date",
    capabilities: { sort: true, filter: true, group: true },
    immich: { sortBy: "localDateTime" },
  },
  {
    id: "fileCreatedAt",
    label: "File created",
    valueType: "date",
    capabilities: { sort: true, filter: false, group: true },
    immich: { sortBy: "fileCreatedAt" },
  },
  {
    id: "originalFileName",
    label: "File name",
    valueType: "string",
    capabilities: { sort: true, filter: true, group: false },
    immich: { sortBy: "fileName" },
  },
  {
    id: "type",
    label: "Media type",
    valueType: "enum",
    capabilities: { sort: false, filter: true, group: true },
    immich: { searchKey: "type" },
  },
  {
    id: "isFavorite",
    label: "Favorite",
    valueType: "boolean",
    capabilities: { sort: false, filter: true, group: true },
    immich: { searchKey: "isFavorite" },
  },
  {
    id: "exif.city",
    label: "City",
    valueType: "string",
    capabilities: { sort: false, filter: true, group: true },
    immich: { searchKey: "city" },
  },
  {
    id: "exif.country",
    label: "Country",
    valueType: "string",
    capabilities: { sort: false, filter: true, group: true },
    immich: { searchKey: "country" },
  },
  {
    id: "description",
    label: "Description",
    valueType: "string",
    capabilities: { sort: false, filter: true, group: false },
    immich: { searchKey: "description" },
  },
  {
    id: "hasDescription",
    label: "Has description",
    valueType: "boolean",
    capabilities: { sort: false, filter: true, group: false },
    clientOnly: true,
  },
  {
    id: "hasLocation",
    label: "Has map location",
    valueType: "boolean",
    capabilities: { sort: false, filter: true, group: false },
    clientOnly: true,
  },
  {
    id: "hasTags",
    label: "Has tags",
    valueType: "boolean",
    capabilities: { sort: false, filter: true, group: false },
    clientOnly: true,
  },
  {
    id: "hasPeople",
    label: "Has faces",
    valueType: "boolean",
    capabilities: { sort: false, filter: true, group: false },
    clientOnly: true,
  },
  {
    id: "tags",
    label: "First tag",
    valueType: "string",
    capabilities: { sort: false, filter: false, group: true },
    clientOnly: true,
  },
  {
    id: "people",
    label: "First person",
    valueType: "string",
    capabilities: { sort: false, filter: false, group: true },
    clientOnly: true,
  },
  {
    id: "month",
    label: "Month (captured)",
    valueType: "string",
    capabilities: { sort: false, filter: false, group: true },
    clientOnly: true,
  },
  {
    id: "captureDate",
    label: "Capture date",
    valueType: "string",
    capabilities: { sort: false, filter: false, group: true },
    clientOnly: true,
  },
  {
    id: "physicalWidthMm",
    label: "Physical width (mm)",
    valueType: "number",
    capabilities: { sort: true, filter: true, group: true },
    clientOnly: true,
  },
  {
    id: "physicalHeightMm",
    label: "Physical height (mm)",
    valueType: "number",
    capabilities: { sort: true, filter: true, group: true },
    clientOnly: true,
  },
  {
    id: "physicalAreaMm2",
    label: "Area (mm²)",
    valueType: "number",
    capabilities: { sort: true, filter: true, group: true },
    clientOnly: true,
  },
  {
    id: "physicalSizeLabel",
    label: "Physical size",
    valueType: "string",
    capabilities: { sort: false, filter: true, group: true },
    clientOnly: true,
  },
];

const fieldMap = new Map(ASSET_FIELDS.map((f) => [f.id, f]));

export function getField(id: string): AssetFieldDescriptor | undefined {
  return fieldMap.get(id);
}

export function sortableFields(): AssetFieldDescriptor[] {
  return ASSET_FIELDS.filter((f) => f.capabilities.sort);
}

export function groupableFields(): AssetFieldDescriptor[] {
  return ASSET_FIELDS.filter((f) => f.capabilities.group);
}
