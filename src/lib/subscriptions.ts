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
