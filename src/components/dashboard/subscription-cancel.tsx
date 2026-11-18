"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, RefreshCw, ShoppingCart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkButton, PageHeader } from "@/components/shared/ui-kit";
import { billingIntervalLabel, getSubscriptionStatus } from "@/lib/subscriptions";
import type { SubscriptionStatusDto } from "@/lib/types";

export function SubscriptionCancel() {
  const [status, setStatus] = useState<SubscriptionStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const checkStatus = useCallback(async () => {
    setChecking(true);
    setError("");
    try {
      const result = await getSubscriptionStatus();
      setStatus(result.subscription);
    } catch (checkError) {
      setError(
        checkError instanceof Error ? checkError.message : "Could not check your plan status",
      );
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    // Defer to a microtask so mount-time state updates are not synchronously
    // triggered from the effect body.
    void Promise.resolve().then(() => checkStatus());
  }, [checkStatus]);

  const purchasedCycleLabel = billingIntervalLabel(status?.billingInterval);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Vendor billing"
        title="Checkout canceled"
        description="No charge was made and your current plan has not changed."
      />
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-orange-500">
            <ShoppingCart className="size-7" />
          </div>
          <CardTitle className="text-xl">You can try again whenever you like</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            Your existing subscription and menu items are untouched. Return to the pricing page to choose monthly or yearly Premium billing.
          </p>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Checking your current plan...
            </div>
          ) : (
            <div className="rounded-lg bg-muted/60 p-4 text-sm">
              <p>
                Current plan: <strong className="capitalize">{status?.plan ?? "free"}</strong>
              </p>
              <p>
                Subscription status: <strong>{status?.status ?? "none"}</strong>
              </p>
              {purchasedCycleLabel ? (
                <p>
                  Purchased cycle: <strong>{purchasedCycleLabel}</strong>
                </p>
              ) : null}
              {status?.cancelAtPeriodEnd ? (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Your existing Premium access remains active until the end of the current period.
                </p>
              ) : null}
            </div>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" disabled={checking || loading} onClick={() => void checkStatus()}>
              {checking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Refresh status
            </Button>
            <LinkButton href="/dashboard/vendor/subscription">
              Back to pricing <ArrowLeft className="size-4" />
            </LinkButton>
            <LinkButton href="/dashboard/vendor" variant="outline">
              Return to dashboard
            </LinkButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
