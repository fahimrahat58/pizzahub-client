"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { OrderCard } from "@/components/dashboard/order-card";
import { ErrorState, PageHeader } from "@/components/shared/ui-kit";
import { ApiError, apiFetch } from "@/lib/api";
import type { OrderDto } from "@/lib/types";

export function OrderDetail({ role }: { role: "customer" | "vendor" | "admin" }) {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ success: boolean; order: OrderDto }>(
        `/api/orders/${params.id}`,
      );
      setOrder(data.order);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 404) {
        setError("Order not found. It may have been removed.");
      } else {
        setError(loadError instanceof Error ? loadError.message : "Could not load this order");
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading order details...
      </div>
    );
  }
  if (error || !order) return <ErrorState message={error || "Order not found"} onRetry={() => void load()} />;

  const backHref =
    role === "customer"
      ? "/dashboard/customer#orders"
      : role === "vendor"
        ? "/dashboard/vendor/orders"
        : "/dashboard/admin#orders";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to orders
      </Link>
      <PageHeader
        eyebrow="Order details"
        title={order.orderNumber}
        description="Every status change is recorded in the timeline below."
      />
      <OrderCard order={order} role={role} onChanged={() => void load()} />
    </div>
  );
}
