"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, CreditCard, Loader2, XCircle } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { PaymentStatusBadge } from "@/components/payments/payment-badges";
import { ErrorState, LinkButton, PageHeader } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { formatMoney, getCheckoutStatus } from "@/lib/payment-api";
import type { CheckoutStatusResponse, PaymentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const FAST_CHECK_INTERVAL_MS = 4_000;
const SLOW_CHECK_INTERVAL_MS = 10_000;
const FAST_CHECK_LIMIT = 12;
const IDENTITY_KEY = "pizzahub-checkout-idempotency-key";

const isVerifiedPaid = (data: CheckoutStatusResponse | null): boolean =>
  data?.paymentStatus === "paid" && data.stripePaymentStatus === "paid";

const isSettledPaymentStatus = (data: CheckoutStatusResponse | null): boolean =>
  data?.paymentStatus === "paid" ||
  data?.paymentStatus === "failed" ||
  data?.paymentStatus === "refunded";

const nextCheckDelay = (attempt: number) =>
  attempt < FAST_CHECK_LIMIT ? FAST_CHECK_INTERVAL_MS : SLOW_CHECK_INTERVAL_MS;

export function PaymentSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { refresh } = useCart();
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const [status, setStatus] = useState<CheckoutStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checks, setChecks] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timer: number | null = null;
    let attempt = 0;
    let latestStatus: CheckoutStatusResponse | null = null;

    const clearTimer = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    async function load(): Promise<void> {
      if (cancelled) return;
      try {
        // Read-only endpoint. This page never marks an order paid.
        const data = await getCheckoutStatus(sessionId!);
        if (cancelled) return;
        attempt += 1;
        setChecks(attempt);
        setError("");

        // A verified backend status must never be replaced by a stale pending read.
        // Refunds are still allowed to supersede a previously paid response.
        if (!isSettledPaymentStatus(latestStatus) || isSettledPaymentStatus(data)) {
          latestStatus = data;
        }
        setStatus(latestStatus);
        setLoading(false);

        if (isVerifiedPaid(latestStatus)) {
          // Only a backend-confirmed paid order may clear the local key/cart.
          sessionStorage.removeItem(IDENTITY_KEY);
          void refreshRef.current();
          setLoading(false);
          return;
        }
        if (
          latestStatus?.paymentStatus === "failed" ||
          latestStatus?.paymentStatus === "refunded" ||
          latestStatus?.stripeSessionStatus?.toLowerCase() === "expired"
        ) {
          setLoading(false);
          return;
        }
      } catch (loadError) {
        if (cancelled) return;
        attempt += 1;
        setChecks(attempt);
        // A transient API/auth failure must not permanently strand a paid order.
        setError(
          loadError instanceof Error ? loadError.message : "Could not check payment status",
        );
        if (loadError instanceof ApiError && loadError.status === 404) {
          // A missing session ID will not become valid by polling again.
          setLoading(false);
          return;
        }
      }

      if (cancelled) return;
      timer = window.setTimeout(() => void load(), nextCheckDelay(attempt));
    }

    void load();
    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [sessionId]);

  const paymentStatus: PaymentStatus | undefined = status?.paymentStatus;
  const stripeSessionStatus = status?.stripeSessionStatus?.toLowerCase() ?? "";
  const stripePaymentStatus = status?.stripePaymentStatus?.toLowerCase() ?? "";
  const isPaid = isVerifiedPaid(status);
  const isFailed = paymentStatus === "failed" || paymentStatus === "refunded";
  const isExpired = !loading && paymentStatus === "pending" && stripeSessionStatus === "expired";
  const stripeSaysPaid = stripeSessionStatus === "complete" && stripePaymentStatus === "paid";
  const isAwaitingBackendConfirmation =
    !loading && paymentStatus === "pending" && stripeSaysPaid;
  const isStillOpen =
    !loading && paymentStatus === "pending" && !isExpired && !isAwaitingBackendConfirmation;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Payment status"
        title="Thanks for your order"
        description="This page only reads the latest status from PizzaHub and Stripe."
      />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-primary" /> Checkout result
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {!sessionId ? (
            <ErrorState message="No checkout session was provided." />
          ) : loading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-5">
                <Loader2 className="size-5 animate-spin text-primary" />
                <div>
                  <p className="font-medium">Confirming your payment...</p>
                  <p className="text-sm text-muted-foreground">
                    Stripe webhooks can take a few seconds to arrive. This page never marks an
                    order paid.
                  </p>
                </div>
              </div>
              {error ? (
                <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                  {error} Retrying automatically (check {Math.max(checks, 1)}).
                </p>
              ) : null}
            </div>
          ) : error && !status ? (
            <ErrorState message={error} />
          ) : !status ? (
            <ErrorState message="Checkout status is unavailable." />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                {isPaid ? (
                  <CheckCircle2 className="size-7 text-emerald-500" />
                ) : isFailed || isExpired ? (
                  <XCircle className="size-7 text-rose-500" />
                ) : (
                  <Clock3 className="size-7 text-amber-500" />
                )}
                {paymentStatus ? (
                  <PaymentStatusBadge status={paymentStatus} />
                ) : (
                  <Badge variant="outline">Unknown</Badge>
                )}
                <Badge variant="outline">Stripe session: {status.stripeSessionStatus}</Badge>
              </div>

              <div className="rounded-xl border border-border/70 p-4 text-sm">
                <p className="font-semibold">{status.order.orderNumber}</p>
                <p className="mt-1 text-muted-foreground">
                  {status.order.items?.length
                    ? status.order.items.map((item) => `${item.quantity} × ${item.name}`).join(", ")
                    : `${status.order.quantity} × ${status.order.menuItemSnapshot.name}`}
                </p>
                <p className="mt-2 text-lg font-semibold text-primary">
                  {formatMoney(
                    status.order.totalAmount ?? status.order.totalPrice,
                    status.order.currency ?? "usd",
                  )}
                </p>
              </div>

              {isPaid ? (
                <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                  Your payment is confirmed. The kitchen has been notified and your order is
                  awaiting preparation.
                </p>
              ) : isFailed ? (
                <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
                  {paymentStatus === "refunded"
                    ? "This payment was refunded. No further payment is confirmed."
                    : "Stripe could not complete this payment. Your cart is still available for another attempt."}
                </p>
              ) : isExpired ? (
                <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
                  This Stripe Checkout Session expired before payment was confirmed. Start a new
                  checkout to try again.
                </p>
              ) : isAwaitingBackendConfirmation ? (
                <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                  Stripe reports this Checkout Session as paid. Waiting for PizzaHub webhook
                  confirmation before marking the order paid. This page keeps checking
                  automatically (check {Math.max(checks, 1)}); Paid appears only after the backend
                  confirms it.
                </p>
              ) : isStillOpen ? (
                <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                  Checkout is still open. No payment is confirmed. You can return to Checkout to
                  finish this attempt. Checking again automatically (check {Math.max(checks, 1)}).
                </p>
              ) : (
                <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                  PizzaHub has not confirmed payment yet (check {Math.max(checks, 1)}). This page
                  keeps checking automatically; refresh if you completed payment in another tab.
                </p>
              )}

              {error && status ? (
                <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                  Last status check failed: {error}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <LinkButton href="/dashboard/customer#orders">Track your order</LinkButton>
                <LinkButton href="/dashboard/customer#payments" variant="outline">
                  Payment history
                </LinkButton>
                <Link href="/checkout" className={cn(buttonVariants({ variant: "ghost" }))}>
                  New checkout
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
