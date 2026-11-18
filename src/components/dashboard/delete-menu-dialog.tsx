"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/dashboard/confirmation-dialog";
import { apiFetch } from "@/lib/api";
import type { MenuItemDto } from "@/lib/types";

export function DeleteMenuDialog({
  item,
  open,
  onOpenChange,
  onDeleted,
}: {
  item: MenuItemDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (item: MenuItemDto) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!item || deleting) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/menu/vendor/${item.id}`, { method: "DELETE" });
      toast.success("Pizza deleted");
      onOpenChange(false);
      onDeleted(item);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete pizza");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? `Delete ${item.name}?` : "Delete this pizza?"}
      description="This removes the pizza from your menu. Past orders and their history are never changed."
      confirmLabel="Delete pizza"
      destructive
      pending={deleting}
      onConfirm={() => void remove()}
    />
  );
}
