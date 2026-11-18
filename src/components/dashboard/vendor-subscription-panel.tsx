"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  ErrorState,
  PageHeader,
} from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  billingIntervalLabel,
  createCheckoutSession,
  createPortalSession,
  getPlans,
  getSubscriptionStatus,
} from "@/lib/subscriptions";
import type {
  BillingPlan,
  PlanPrice,
  SubscriptionStatus,
  SubscriptionStatusDto,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const statusLabels: Record<SubscriptionStatus, string> = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Payment past due",
  unpaid: "Unpaid",
  incomplete: "Incomplete",
  incomplete_expired: "Expired",
  canceled: "Canceled",
  paused: "Paused",
  none: "No subscription",
};

const freeFeatures = [
  "Max 3 active menu items",
  "Max 3 restaurants",
  "Basic vendor dashboard",
  "Order management",
];

const premiumFeatures = [
  "Unlimited active items",
  "Unlimited restaurants",
  "Premium vendor badge",
  "Featured menu placement",
  "All Free features",
];

const formatPrice = (plan: PlanPrice | undefined, fallback: string) => {
  if (!plan || plan.amount === null) return fallback;
  const amount = (plan.amount / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${amount}`;
};

const formatDate = (value: string | null) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function VendorSubscriptionPanel() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionStatusDto | null>(null);
  const [plans, setPlans] = useState<PlanPrice[]>([]);
  const [configured, setConfigured] = useState(false);
  const [billing, setBilling] = useState<BillingPlan>("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState<BillingPlan | "portal" | "refresh" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statusResult, plansResult] = await Promise.all([
        getSubscriptionStatus(),
        getPlans(),
      ]);
      setSubscription(statusResult.subscription);
      if (statusResult.subscription.billingInterval) {
        // Align the selector with the purchased cycle; it is still only a
        // future-purchase choice, never the source of truth for current plan.
        setBilling(
          statusResult.subscription.billingInterval === "year" ? "yearly" : "monthly",
        );
      }
      setPlans(plansResult.plans);
      setConfigured(plansResult.configured);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load billing details",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer to a microtask so mount-time state updates are not synchronously
    // triggered from the effect body.
    void Promise.resolve().then(load);
  }, [load]);

  const fetchStatus = useCallback(async () => {
    const result = await getSubscriptionStatus();
    setSubscription(result.subscription);
    if (result.subscription.billingInterval) {
      setBilling(
        result.subscription.billingInterval === "year" ? "yearly" : "monthly",
      );
    }
    return result.subscription;
  }, []);

  // Returning from Stripe's portal can happen without a full page reload.
  // Always re-read MongoDB-backed state instead of assuming the toggle or a
  // cached server component reflects the purchase.
  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchStatus().catch(() => undefined);
      }
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [fetchStatus]);

  const subscribe = async (plan: BillingPlan) => {
    setAction(plan);
    try {
      const result = await createCheckoutSession(plan);
      toast.success("Redirecting to secure Stripe checkout...");
      window.location.assign(result.url);
    } catch (subscribeError) {
      toast.error(
        subscribeError instanceof Error
          ? subscribeError.message
          : "Could not start checkout",
      );
      setAction(null);
    }
  };

  const openPortal = async () => {
    setAction("portal");
    try {
      const result = await createPortalSession();
      window.location.assign(result.url);
    } catch (portalError) {
      toast.error(
        portalError instanceof Error
          ? portalError.message
          : "Could not open the billing portal",
      );
      setAction(null);
    }
  };

  const refresh = async () => {
    setAction("refresh");
    try {
      const current = await fetchStatus();
      if (current.isPremium) router.refresh();
      toast.success("Subscription status refreshed");
    } catch (refreshError) {
      toast.error(
        refreshError instanceof Error
          ? refreshError.message
          : "Could not refresh subscription status",
      );
    } finally {
      setAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading your plan...
      </div>
    );
  }

  if (error || !subscription) {
    return <ErrorState message={error || "Could not load billing details"} onRetry={() => void load()} />;
  }

  const monthly = plans.find((plan) => plan.id === "monthly");
  const yearly = plans.find((plan) => plan.id === "yearly");
  // This badge describes the cycle Stripe sold, not the pricing toggle below.
  const purchasedCycleLabel = subscription.isPremium
    ? billingIntervalLabel(subscription.billingInterval)
    : null;
  const activePrice = billing === "monthly" ? monthly : yearly;
  const busy = action !== null;
  const canSubscribe = configured && !subscription.isPremium && !busy;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vendor billing"
        title="Choose the plan that fits your kitchen"
        description="Stripe securely handles all payments. Premium stays active only after Stripe confirms the subscription."
      />

      <Card className="overflow-hidden border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Your current plan</h2>
              <Badge variant={subscription.isPremium ? "default" : "outline"}>
                {subscription.isPremium ? (
                  <><Sparkles className="mr-1 size-3" /> Premium</>
                ) : (
                  "Free"
                )}
              </Badge>
              <Badge variant="secondary">{statusLabels[subscription.status] ?? subscription.status}</Badge>
              {purchasedCycleLabel ? (
                <Badge variant="outline">{purchasedCycleLabel} billing</Badge>
              ) : null}
              {subscription.canceledAt ? <Badge variant="destructive">Canceled</Badge> : null}
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarClock className="size-4" />
              {subscription.cancelAtPeriodEnd
                ? `Premium ends on ${formatDate(subscription.subscriptionExpiresAt)}`
                : subscription.isPremium
                  ? `Renews on ${formatDate(subscription.subscriptionExpiresAt)}`
                  : "Upgrade any time to unlock every vendor feature"}
            </p>
            {subscription.cancelAtPeriodEnd ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Your subscription is set to cancel
                {subscription.cancelAt
                  ? ` on ${formatDate(subscription.cancelAt)}`
                  : " at the end of the billing period"}
                . Premium remains active until then.
              </p>
            ) : null}
            {subscription.endedAt ? (
              <p className="text-sm text-destructive">
                Subscription ended {formatDate(subscription.endedAt)}.
              </p>
            ) : null}
            {subscription.currentPeriodStart ? (
              <p className="text-xs text-muted-foreground">
                Current period started {formatDate(subscription.currentPeriodStart)}
                {subscription.canceledAt
                  ? ` · Canceled ${formatDate(subscription.canceledAt)}`
                  : ""}
              </p>
            ) : null}
            {subscription.stripeSubscriptionId ? (
              <p className="font-mono text-xs text-muted-foreground">
                Subscription {subscription.stripeSubscriptionId}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void refresh()}
            >
              {action === "refresh" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Check status
            </Button>
            {subscription.hasBillingAccount ? (
              <Button variant="outline" disabled={busy} onClick={() => void openPortal()}>
                {action === "portal" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ExternalLink className="size-4" />
                )}
                Manage subscription
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {!configured ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          Checkout is temporarily unavailable because Stripe pricing is not configured on the server. You can still review the plans below.
        </div>
      ) : null}

      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-border bg-muted/50 p-1">
          {(["monthly", "yearly"] as BillingPlan[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setBilling(value)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition",
                billing === value
                  ? "bg-background text-orange-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "monthly" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Free
              {!subscription.isPremium ? (
                <Badge variant="outline">Current plan</Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6">
            <div>
              <p className="text-3xl font-bold">$0</p>
              <p className="text-sm text-muted-foreground">Free forever</p>
            </div>
            <ul className="space-y-3 text-sm">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-auto" disabled>
              Included
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col border-orange-500/40 shadow-lg shadow-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="size-5 text-orange-500" /> Premium
              </span>
              {subscription.isPremium ? (
                <Badge>Current plan</Badge>
              ) : (
                <Badge variant="secondary">Most popular</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6">
            <div>
              <p className="text-3xl font-bold">
                {formatPrice(activePrice, "See price at checkout")}
                {activePrice?.amount !== null && activePrice ? (
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}/ {billing === "monthly" ? "month" : "year"}
                  </span>
                ) : null}
              </p>
              <p className="text-sm text-muted-foreground">
                Billed {billing === "monthly" ? "monthly" : "yearly"} via Stripe
              </p>
            </div>
            <ul className="space-y-3 text-sm">
              {premiumFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
            {subscription.isPremium ? (
              <Button className="mt-auto" variant="outline" disabled={busy} onClick={() => void openPortal()}>
                Manage your subscription <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                className="mt-auto"
                disabled={!canSubscribe}
                onClick={() => void subscribe(billing)}
              >
                {action === billing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Upgrade to Premium
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-medium">Feature</th>
                  <th className="py-2 pr-4 font-medium">Free</th>
                  <th className="py-2 font-medium">Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Active menu items", "Max 3", "Unlimited"],
                  ["Vendor dashboard", "Basic", "All Free features"],
                  ["Order management", "Yes", "Yes"],
                  ["Premium vendor badge", "No", "Yes"],
                  ["Featured menu placement", "No", "Yes"],
                ].map(([label, free, premium]) => (
                  <tr key={label} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4">{label}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{free}</td>
                    <td className="py-3 font-medium text-orange-600 dark:text-orange-400">{premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Payments are processed by Stripe. PizzaHub never stores card details.
        Need help?{" "}
        <Link
          href="/dashboard/vendor/profile"
          className="text-orange-500 hover:underline"
        >
          Contact support
        </Link>
        .
      </p>
    </div>
  );
}
