"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";

import { OrderCard } from "@/components/dashboard/order-card";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shared/ui-kit";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { OrderDto, OrderStatus } from "@/lib/types";
import { markVendorOrdersSeen } from "@/lib/vendor-order-notifications";

const FILTERS = [
  { value: "all", label: "All orders" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
] as const;

const selectClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-52 dark:bg-input/30";

export function VendorOrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ success: boolean; orders: OrderDto[] }>(
        "/api/orders/vendor?limit=100",
      );
      setOrders(data.orders);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  // Visiting this route clears the new-order badge for this vendor.
  useEffect(() => {
    void markVendorOrdersSeen().catch(() => undefined);
  }, []);

  const pending = orders.filter((order) => order.status === "pending").length;
  const active = orders.filter((order) =>
    ["accepted", "preparing", "out_for_delivery"].includes(order.status),
  ).length;
  const completed = orders.filter((order) => order.status === "delivered").length;
  const visible =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === (filter as OrderStatus));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading orders...
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vendor workspace"
        title="Orders"
        description="Only orders placed from your restaurants are shown here. Update each order as it moves through delivery."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending", value: pending },
          { label: "In progress", value: active },
          { label: "Delivered", value: completed },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 py-4">
              <ClipboardList className="size-5 text-primary" />
              <div>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing {visible.length} of {orders.length} order(s)
        </p>
        <select
          aria-label="Filter orders by status"
          className={selectClass}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          {FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {visible.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {visible.map((order) => (
            <OrderCard key={order.id} order={order} role="vendor" onChanged={() => void load()} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardList className="size-5" />}
          title="No orders here"
          description={
            orders.length
              ? "No orders match this status filter."
              : "New customer orders will appear here automatically."
          }
        />
      )}
    </div>
  );
}
