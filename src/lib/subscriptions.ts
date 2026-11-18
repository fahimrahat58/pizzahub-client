"use client";

import { apiFetch } from "@/lib/api";
import type {
  BillingPlan,
  PlansResponse,
  SubscriptionStatusDto,
} from "@/lib/types";

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
