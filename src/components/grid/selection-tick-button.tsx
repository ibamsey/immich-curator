"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectionTickButtonProps = {
  selected: boolean;
  indeterminate?: boolean;
  onToggle: () => void;
  /** e.g. "Select photo" or "Select date group" */
  ariaLabel: string;
  className?: string;
  size?: "sm" | "md";
};

export function SelectionTickButton({
  selected,
  indeterminate = false,
  onToggle,
  ariaLabel,
  className,
  size = "sm",
}: SelectionTickButtonProps) {
  const iconSize = size === "sm" ? "size-5" : "size-6";
  const pressed = selected || indeterminate;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={pressed}
      className={cn(
        "shrink-0 rounded-full bg-background/80 p-0.5 shadow-sm ring-1 ring-border/80 backdrop-blur-[2px] transition-opacity hover:bg-background",
        className,
      )}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onToggle();
      }}
    >
      {selected ? (
        <CheckCircle2
          className={cn(iconSize, "text-primary")}
          aria-hidden
        />
      ) : indeterminate ? (
        <CheckCircle2
          className={cn(iconSize, "text-primary/45")}
          aria-hidden
        />
      ) : (
        <Circle
          className={cn(iconSize, "text-muted-foreground")}
          aria-hidden
        />
      )}
    </button>
  );
}
