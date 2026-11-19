"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

import { ErrorState, PageHeader } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
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

type PanelAction = BillingPlan | "portal" | "refresh";

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
  const [subscription, setSubscription] =
    useState<SubscriptionStatusDto | null>(null);
  const [plans, setPlans] = useState<PlanPrice[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState<PanelAction | null>(null);
  const actionRef = useRef<PanelAction | null>(null);

  const beginAction = useCallback((next: PanelAction) => {
    if (actionRef.current) return false;
    actionRef.current = next;
    setAction(next);
    return true;
  }, []);

  const endAction = useCallback(() => {
    actionRef.current = null;
    setAction(null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statusResult, plansResult] = await Promise.all([
        getSubscriptionStatus(),
        getPlans(),
      ]);
      setSubscription(statusResult.subscription);
      setPlans(plansResult.plans);
      setConfigured(plansResult.configured);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load billing details",
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
    // A back/forward-cache restore can keep React state from before the portal
    // redirect, including a stuck "portal" action. Clear it as soon as the
    // restored page is shown, then re-read the backend state.
    const handlePageShow = (event: PageTransitionEvent) => {
      endAction();
      if (event.persisted) void fetchStatus().catch(() => undefined);
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [endAction, fetchStatus]);

  const subscribe = async (plan: BillingPlan) => {
    if (!beginAction(plan)) return;
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
    } finally {
      endAction();
    }
  };

  const openPortal = async () => {
    if (!beginAction("portal")) return;
    try {
      // Always ask the backend for a new session. Portal URLs are short-lived
      // and must never be cached or reused after returning from Stripe.
      const result = await createPortalSession();
      if (!result.url) {
        throw new Error(
          "Stripe did not return a billing portal URL. Please try again.",
        );
      }
      window.location.assign(result.url);
    } catch (portalError) {
      toast.error(
        portalError instanceof Error
          ? portalError.message
          : "Could not open the billing portal",
      );
    } finally {
      endAction();
    }
  };

  const refresh = async () => {
    if (!beginAction("refresh")) return;
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
      endAction();
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
    return (
      <ErrorState
        message={error || "Could not load billing details"}
        onRetry={() => void load()}
      />
    );
  }

  const monthly = plans.find((plan) => plan.id === "monthly");
  const yearly = plans.find((plan) => plan.id === "yearly");
  // Only the live Stripe Price interval decides which Premium card is current.
  // The persisted value and any future-purchase choice are not used here.
  const stripePurchasedInterval = subscription.isPremium
    ? subscription.stripeRecurringInterval
    : null;
  const busy = action !== null;
  const canSubscribe = configured && !subscription.isPremium && !busy;
  const premiumCards: Array<{
    id: BillingPlan;
    name: string;
    interval: "month" | "year";
    price: PlanPrice | undefined;
    suffix: string;
    billed: string;
  }> = [
    {
      id: "monthly",
      name: "Premium Monthly",
      interval: "month",
      price: monthly,
      suffix: "/ month",
      billed: "monthly",
    },
    {
      id: "yearly",
      name: "Premium Yearly",
      interval: "year",
      price: yearly,
      suffix: "/ year",
      billed: "yearly",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vendor billing"
        title="Choose the plan that fits your kitchen"
        description="Stripe securely handles all payments. Premium stays active only after Stripe confirms the subscription."
      />

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Your current plan</h2>
              <Badge variant="secondary">
                {statusLabels[subscription.status] ?? subscription.status}
              </Badge>
              {subscription.canceledAt ? (
                <Badge variant="destructive">Canceled</Badge>
              ) : null}
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
                Current period started{" "}
                {formatDate(subscription.currentPeriodStart)}
                {subscription.canceledAt
                  ? ` · Canceled ${formatDate(subscription.canceledAt)}`
                  : ""}
              </p>
            ) : null}
            {subscription.stripeSubscriptionId ? (
              <p className="break-all font-mono text-xs text-muted-foreground">
                Subscription {subscription.stripeSubscriptionId}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
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
              <Button
                variant="outline"
                className="min-h-11 w-full sm:w-auto"
                disabled={busy}
                onClick={() => void openPortal()}
              >
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
          Checkout is temporarily unavailable because Stripe pricing is not
          configured on the server. You can still review the plans below.
        </div>
      ) : null}

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="flex min-w-0 flex-col">
          <CardHeader className="min-w-0 gap-3 sm:gap-4">
            <CardTitle className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              Free
              {!subscription.isPremium ? (
                <Badge variant="outline" className="shrink-0">
                  Current plan
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6">
            <div>
              <p className="text-3xl font-bold">$0</p>
              <p className="text-sm text-muted-foreground">Free forever</p>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span className="min-w-0">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="mt-auto min-h-11 w-full sm:w-auto"
              size="lg"
              disabled
            >
              Included
            </Button>
          </CardContent>
        </Card>

        {premiumCards.map((card) => {
          const isCurrentPlan =
            subscription.isPremium && stripePurchasedInterval === card.interval;
          return (
            <Card
              key={card.id}
              className={cn(
                "flex min-w-0 flex-col border-primary/40 shadow-lg shadow-primary/5",
                isCurrentPlan && "ring-2 ring-primary/60",
              )}
            >
              <CardHeader className="min-w-0 gap-3 sm:gap-4">
                <CardTitle className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Sparkles className="size-5 shrink-0 text-primary" />
                    <span className="min-w-0 break-words text-sm sm:text-base">
                      {card.name}
                    </span>
                  </span>
                  {isCurrentPlan ? (
                    <Badge className="shrink-0">Current plan</Badge>
                  ) : card.id === "yearly" ? (
                    <Badge variant="secondary" className="shrink-0">
                      Most popular
                    </Badge>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-6">
                <div>
                  <p className="flex flex-wrap items-baseline gap-x-1 text-2xl font-bold sm:text-3xl">
                    {formatPrice(card.price, "See price at checkout")}
                    {card.price?.amount !== null && card.price ? (
                      <span className="text-xs font-normal text-muted-foreground sm:text-sm">
                        {card.suffix}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Billed {card.billed} via Stripe
                  </p>
                </div>
                <ul className="space-y-3 text-sm leading-relaxed">
                  {premiumFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <span className="min-w-0">{feature}</span>
                    </li>
                  ))}
                </ul>
                {subscription.isPremium ? (
                  <Button
                    className="mt-auto min-h-11 w-full sm:w-auto"
                    size="lg"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void openPortal()}
                  >
                    Manage your subscription <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    className="mt-auto min-h-11 w-full sm:w-auto"
                    size="lg"
                    disabled={!canSubscribe}
                    onClick={() => void subscribe(card.id)}
                  >
                    {action === card.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    Upgrade to Premium
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
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
                  <tr
                    key={label}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="py-3 pr-4">{label}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{free}</td>
                    <td className="py-3 font-medium text-primary dark:text-primary">
                      {premium}
                    </td>
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
          href="/contact-support"
          className="text-primary hover:underline"
        >
          Contact support
        </Link>
        .
      </p>
    </div>
  );
}
