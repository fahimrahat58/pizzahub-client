"use client";

import { apiFetch } from "@/lib/api";
import type {
  BillingInterval,
  BillingPlan,
  PlansResponse,
  SubscriptionStatusDto,
} from "@/lib/types";

/** Labels only the cycle Stripe actually purchased; never the pricing toggle. */
export const billingIntervalLabel = (interval?: BillingInterval | null): string | null => {
  if (interval === "month") return "Monthly";
  if (interval === "year") return "Yearly";
  return null;
};

/**
 * Resolves the cycle the vendor actually purchased. The live Stripe Price
 * interval wins; the verified persisted interval is the fallback. The future
 * purchase selector is deliberately not an input here.
 */
export const getPurchasedBillingInterval = (
  subscription?: Pick<
    SubscriptionStatusDto,
    "stripeRecurringInterval" | "billingInterval"
  > | null,
): BillingInterval | null => {
  if (
    subscription?.stripeRecurringInterval === "month" ||
    subscription?.stripeRecurringInterval === "year"
  ) {
    return subscription.stripeRecurringInterval;
  }
  return subscription?.billingInterval ?? null;
};

export const FREE_RESTAURANT_LIMIT_MESSAGE =
  "You have reached the maximum limit of 3 restaurants. Upgrade to Premium to add more restaurants.";

export const getSubscriptionStatus = () =>
  apiFetch<{ success: boolean; subscription: SubscriptionStatusDto }>(
    "/api/subscriptions/status",
  );

export const getPlans = () => apiFetch<PlansResponse>("/api/subscriptions/plans");

export const createCheckoutSession = (plan: BillingPlan) =>
  apiFetch<{ success: boolean; url: string; sessionId: string }>(
    "/api/subscriptions/create-checkout-session",
    { method: "POST", body: { plan } },
  );

export const createPortalSession = () =>
  apiFetch<{ success: boolean; url: string }>(
    "/api/subscriptions/create-portal-session",
    { method: "POST" },
  );
