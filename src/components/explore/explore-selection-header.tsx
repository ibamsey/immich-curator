"use client";

import { Button } from "@/components/ui/button";

type ExploreSelectionHeaderProps = {
  count: number;
  onClear: () => void;
};

export function ExploreSelectionHeader({
  count,
  onClear,
}: ExploreSelectionHeaderProps) {
  if (count <= 0) return null;
  return (
    <div className="mb-4 flex items-center justify-between gap-2 border-b border-border pb-3">
      <p className="text-sm font-medium">
        {count} photo{count === 1 ? "" : "s"} selected
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
