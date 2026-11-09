"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Extra body below the description (e.g. merge direction details). */
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void;
  /** Stack above another open dialog (e.g. asset preview modal). */
  elevated?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  loading = false,
  onConfirm,
  elevated = false,
}: ConfirmDialogProps) {
  const stackClass = elevated ? "z-[100]" : undefined;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!loading}
        className={stackClass}
        overlayClassName={stackClass}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          {children ? (
            <div className="text-sm text-foreground [&_ul]:mt-2 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:space-y-1">
              {children}
            </div>
          ) : null}
        </DialogHeader>
        <DialogFooter className="border-t-0 bg-transparent p-0 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            size="sm"
            disabled={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
