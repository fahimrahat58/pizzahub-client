"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";

import { OrderCard } from "@/components/dashboard/order-card";
import { PaymentStatusBadge } from "@/components/payments/payment-badges";
import { ErrorState, PageHeader } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, apiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/payment-api";
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4 text-primary" /> Payment information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Payment status</p>
            <div className="mt-1">
              {order.paymentStatus ? (
                <PaymentStatusBadge status={order.paymentStatus} />
              ) : (
                <Badge variant="outline">Not recorded</Badge>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Order status</p>
            <p className="mt-1 font-medium capitalize">{order.status.replaceAll("_", " ")}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Amount paid</p>
            <p className="mt-1 font-semibold text-primary">
              {formatMoney(order.totalAmount ?? order.totalPrice, order.currency ?? "usd")}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Provider</p>
            <p className="mt-1 font-medium capitalize">{order.paymentMethod ?? "Not recorded"}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 sm:col-span-2">
            <p className="text-xs text-muted-foreground">Secure payment reference</p>
            <p className="mt-1 break-all font-mono text-xs">
              {order.stripePaymentIntentId
                ? `${order.stripePaymentIntentId.slice(0, 20)}…`
                : order.stripeSessionId
                  ? `${order.stripeSessionId.slice(0, 20)}…`
                  : "No payment reference yet"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
