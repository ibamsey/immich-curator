/** Ordered read-only metadata rows in the curation panel. */
export type MetadataDisplayRow =
  | { kind: "stored"; id: string }
  | { kind: "computed"; id: string };

export const ASSET_METADATA_DISPLAY_ROWS: MetadataDisplayRow[] = [
  { kind: "stored", id: "originalFileName" },
  { kind: "stored", id: "tags" },
  { kind: "stored", id: "pixelDimensions" },
  { kind: "computed", id: "physicalSizeLabel" },
  { kind: "computed", id: "physicalAreaMm2" },
  { kind: "stored", id: "localDateTime" },
  { kind: "stored", id: "fileCreatedAt" },
];
