"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { LinkButton } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  billingIntervalLabel,
  getPurchasedBillingInterval,
  getSubscriptionStatus,
} from "@/lib/subscriptions";
import type { SubscriptionStatusDto } from "@/lib/types";

const CHECK_INTERVAL_MS = 4_000;
const MAX_AUTOMATIC_CHECKS = 12;

export function SubscriptionSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<SubscriptionStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");

  const checkStatus = useCallback(async (announce: boolean) => {
    setChecking(true);
    setError("");
    setAttempts((value) => value + 1);
    try {
      const result = await getSubscriptionStatus();
      setStatus(result.subscription);
      if (result.subscription.isPremium) router.refresh();
      if (announce) {
        toast.success(
          result.subscription.isPremium
            ? "Premium is active"
            : "Still waiting for Stripe confirmation",
        );
      }
    } catch (checkError) {
      const message =
        checkError instanceof Error ? checkError.message : "Could not check your status";
      setError(message);
      if (announce) toast.error(message);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    // Defer to a microtask so mount-time state updates are not synchronously
    // triggered from the effect body.
    void Promise.resolve().then(() => checkStatus(false));
  }, [checkStatus]);

  const isPremium = status?.isPremium === true;
  const purchasedCycleLabel = billingIntervalLabel(getPurchasedBillingInterval(status));

  useEffect(() => {
    if (loading || isPremium || attempts >= MAX_AUTOMATIC_CHECKS) return;
    const timer = window.setTimeout(() => void checkStatus(false), CHECK_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [attempts, checkStatus, isPremium, loading]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="border-primary/30">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isPremium ? <Sparkles className="size-7" /> : <CheckCircle2 className="size-7" />}
          </div>
          <CardTitle className="text-2xl">
            {isPremium ? "Premium is active" : "Payment successful"}
          </CardTitle>
          <div className="flex justify-center pt-2">
            <Badge variant={isPremium ? "default" : "secondary"}>
              {isPremium ? "Premium active" : "Subscription activation pending"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 text-center">
          <p className="text-muted-foreground">
            {isPremium
              ? "Stripe has confirmed your subscription. Your Premium benefits are unlocked, including unlimited active menu items."
              : "Stripe has received your payment. Premium is activated only after Stripe's verified webhook reaches PizzaHub. We are checking your status automatically; you can refresh at any time."}
          </p>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Checking your subscription...
            </div>
          ) : (
            <div className="rounded-lg bg-muted/60 p-4 text-sm">
              <p>
                Current plan: <strong className="capitalize">{status?.plan ?? "free"}</strong>
              </p>
              <p>
                Stripe status: <strong>{status?.status ?? "pending"}</strong>
              </p>
              {purchasedCycleLabel ? (
                <p>
                  Purchased cycle: <strong>{purchasedCycleLabel}</strong>
                </p>
              ) : null}
              {!isPremium && attempts >= MAX_AUTOMATIC_CHECKS ? (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Automatic checks have paused. Use the refresh button below if you have just
                  completed payment.
                </p>
              ) : null}
              {sessionId ? (
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  Checkout session {sessionId}
                </p>
              ) : null}
            </div>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              disabled={checking || loading}
              onClick={() => void checkStatus(true)}
            >
              {checking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Retry / Refresh Status
            </Button>
            <LinkButton href="/dashboard/vendor/subscription">
              {isPremium ? "View your plan" : "Back to pricing"}
            </LinkButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
