"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Loader2, MapPin, PackageCheck, Star, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";

import { ReviewDialog } from "@/components/public/review-dialog";
import {
  ConfirmDialog,
  OrderStatusBadge,
} from "@/components/shared/ui-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { OrderDto, OrderStatus } from "@/lib/types";

const statusIcons: Partial<Record<OrderStatus, typeof Clock3>> = {
  pending: Clock3,
  accepted: CheckCircle2,
  preparing: PackageCheck,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
  rejected: XCircle,
};

export function OrderCard({
  order,
  role,
  onChanged,
}: {
  order: OrderDto;
  role: "customer" | "vendor" | "admin";
  onChanged?: () => void;
}) {
  const [action, setAction] = useState<"cancel" | "reject" | null>(null);
  const [pending, setPending] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const runAction = async (path: string, body?: unknown) => {
    setPending(true);
    try {
      const response = await apiFetch<{
        message?: string;
        email?: { sent: boolean; warning?: string };
      }>(path, {
        method: "PATCH",
        body,
      });
      toast.success(response.message ?? "Order updated");
      if (response.email && !response.email.sent) {
        toast.warning("Order updated, but the email notification could not be sent.", {
          description: response.email.warning,
        });
      }
      setAction(null);
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update order");
    } finally {
      setPending(false);
    }
  };

  const nextStatus = (() => {
    if (order.status === "accepted") return "preparing";
    if (order.status === "preparing") return "out_for_delivery";
    if (order.status === "out_for_delivery") return "delivered";
    return null;
  })();

  const detailHref = `/dashboard/${role}/orders/${order.id}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">{order.orderNumber}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
          </p>
          <Link href={detailHref} className="mt-1 inline-block text-xs font-medium text-primary hover:underline">
            View details
          </Link>
        </div>
        <OrderStatusBadge status={order.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 rounded-xl bg-muted/40 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.menuItemSnapshot.image}
            alt={order.menuItemSnapshot.name}
            className="size-16 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{order.menuItemSnapshot.name}</p>
            <p className="text-sm text-muted-foreground">
              Qty {order.quantity} × ${order.unitPrice.toFixed(2)}
            </p>
            <p className="mt-1 font-semibold text-primary">
              ${order.totalPrice.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 size-4 shrink-0" /> {order.deliveryAddress}
          </p>
          <p>
            Delivery: {new Date(`${order.deliveryDate}T00:00:00`).toLocaleDateString()}
          </p>
          {role !== "customer" ? (
            <>
              <p>
                Restaurant:{" "}
                {order.restaurantName ??
                  order.menuItemSnapshot.restaurantName ??
                  "Unknown restaurant"}
              </p>
              <p>Customer: {order.customerSnapshot.name}</p>
              <p className="truncate">Email: {order.customerSnapshot.email}</p>
              <p className="font-mono text-xs">ID: {order.id}</p>
            </>
          ) : null}
          {role === "customer" ? (
            <p>Order #{order.orderNumber.slice(-6)}</p>
          ) : null}
        </div>

        {order.message ? (
          <p className="rounded-lg border border-border/70 p-3 text-sm italic text-muted-foreground">
            “{order.message}”
          </p>
        ) : null}

        <div className="space-y-2 border-t border-border/70 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Timeline
          </p>
          <ol className="space-y-2">
            {order.timeline.map((entry, index) => {
              const Icon = statusIcons[entry.status] ?? Clock3;
              return (
                <li key={`${entry.status}-${index}`} className="flex items-start gap-2.5 text-sm">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium capitalize">{entry.note ?? entry.status.replaceAll("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.at).toLocaleString()} · {entry.by}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {role === "customer" && order.status === "pending" ? (
          <Button variant="destructive" size="sm" onClick={() => setAction("cancel")}>
            Cancel order
          </Button>
        ) : null}

        {role === "customer" && order.status === "delivered" ? (
          <Button size="sm" variant="secondary" onClick={() => setReviewOpen(true)}>
            <Star className="size-4 text-amber-500" /> Write a Review
          </Button>
        ) : null}

        {role === "vendor" && order.status === "pending" ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void runAction(`/api/orders/${order.id}/accept`)} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Accept
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setAction("reject")}>
              Reject
            </Button>
          </div>
        ) : null}

        {role === "vendor" && nextStatus ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              void runAction(`/api/orders/${order.id}/status`, { status: nextStatus })
            }
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Mark as {nextStatus.replaceAll("_", " ")}
          </Button>
        ) : null}
      </CardContent>

      <ConfirmDialog
        open={action !== null}
        onOpenChange={(open) => !open && setAction(null)}
        title={action === "reject" ? "Reject this order?" : "Cancel this order?"}
        description={
          action === "reject"
            ? "The customer will be notified that this order cannot be fulfilled."
            : "This will cancel your order and release the delivery slot."
        }
        confirmLabel={action === "reject" ? "Reject order" : "Cancel order"}
        destructive
        pending={pending}
        onConfirm={() => {
          if (!action) return;
          void runAction(`/api/orders/${order.id}/${action === "reject" ? "reject" : "cancel"}`);
        }}
      />

      {role === "customer" && order.status === "delivered" ? (
        <ReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          order={order}
          onSaved={onChanged}
        />
      ) : null}
    </Card>
  );
}
