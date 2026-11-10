"use client";

import { Tags, TagX } from "lucide-react";
import { BulkTagActionBody } from "@/components/explore/bulk-tag-action-body";
import { BulkTagRemoveActionBody } from "@/components/explore/bulk-tag-remove-action-body";
import type { MultiAssetAction } from "@/lib/assets/multi-asset-action-types";

export const bulkTagAction: MultiAssetAction = {
  id: "bulk-tags-add",
  label: "Add tags",
  icon: Tags,
  Body: BulkTagActionBody,
};

export const bulkTagRemoveAction: MultiAssetAction = {
  id: "bulk-tags-remove",
  label: "Remove tags",
  icon: TagX,
  Body: BulkTagRemoveActionBody,
};

export const multiAssetActions: MultiAssetAction[] = [
  bulkTagAction,
  bulkTagRemoveAction,
];
