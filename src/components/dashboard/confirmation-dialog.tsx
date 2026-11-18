"use client";

import { ConfirmDialog } from "@/components/shared/ui-kit";

/**
 * Shared confirmation wrapper used by all vendor destructive actions, keeping
 * button labels, cancel behaviour, and pending states consistent.
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      destructive={destructive}
      pending={pending}
      onConfirm={onConfirm}
    />
  );
}
