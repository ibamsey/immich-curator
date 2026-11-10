import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { GridAsset } from "@/lib/assets/grid-asset";

export type MultiAssetActionDone = () => void;

export type MultiAssetActionBodyProps = {
  assetIds: string[];
  assets: GridAsset[];
  onDone: MultiAssetActionDone;
};

export type MultiAssetActionConfirm = {
  title: string;
  description: (count: number) => string;
  confirmVariant?: "default" | "destructive";
};

export type MultiAssetAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  Body: ComponentType<MultiAssetActionBodyProps>;
  confirm?: MultiAssetActionConfirm;
};
