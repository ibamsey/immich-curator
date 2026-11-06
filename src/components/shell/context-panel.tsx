"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type ContextPanelProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function ContextPanel({
  open,
  onClose,
  title,
  children,
}: ContextPanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close panel"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[var(--panel-width)] flex-col border-l border-border bg-card shadow-xl transition-transform duration-200 lg:static lg:z-0 lg:shrink-0 lg:shadow-none",
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0 lg:w-0 lg:border-0 lg:overflow-hidden",
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "flex h-full w-[var(--panel-width)] flex-col",
            !open && "lg:invisible",
          )}
        >
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
            <span className="truncate text-sm font-medium">
              {title ?? "Details"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
            {children}
          </div>
        </div>
      </aside>
    </>
  );
}
