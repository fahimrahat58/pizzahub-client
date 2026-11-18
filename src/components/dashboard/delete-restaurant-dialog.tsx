"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/dashboard/confirmation-dialog";
import { apiFetch } from "@/lib/api";
import type { RestaurantDto } from "@/lib/types";

export function DeleteRestaurantDialog({
  restaurant,
  open,
  onOpenChange,
  onDeleted,
}: {
  restaurant: RestaurantDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (restaurant: RestaurantDto) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!restaurant || deleting) return;
    setDeleting(true);
    try {
      const data = await apiFetch<{
        success: boolean;
        message: string;
        deletedMenuItems: number;
      }>(`/api/restaurants/mine/${restaurant.id}`, { method: "DELETE" });
      toast.success(
        data.deletedMenuItems > 0
          ? `${data.message} ${data.deletedMenuItems} menu item(s) without order or review history were removed.`
          : data.message,
      );
      onOpenChange(false);
      onDeleted(restaurant);
    } catch (error) {
      // A 409 explains which items still have history; show the backend verbatim.
      toast.error(
        error instanceof Error ? error.message : "Could not delete restaurant",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={restaurant ? `Delete ${restaurant.name}?` : "Delete this restaurant?"}
      description="Menu items with no order or review history are removed with the restaurant. Orders, delivery history, and items with history are preserved; move or delete those items first."
      confirmLabel="Delete restaurant"
      destructive
      pending={deleting}
      onConfirm={() => void remove()}
    />
  );
}
