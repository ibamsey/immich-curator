"use client";

import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AlbumSharedIndicatorProps = {
  className?: string;
  title?: string;
};

export function AlbumSharedIndicator({
  className,
  title = "Shared with curator operator",
}: AlbumSharedIndicatorProps) {
  return (
    <span title={title}>
      <Share2
        className={cn("size-3.5 shrink-0 text-primary", className)}
        aria-label={title}
      />
    </span>
  );
}

export function albumSharedWithOperator(
  album: { albumUsers?: { user: { id: string } }[] },
  operatorUserId: string | null,
): boolean {
  if (!operatorUserId) return false;
  return Boolean(
    album.albumUsers?.some((u) => u.user.id === operatorUserId),
  );
}
