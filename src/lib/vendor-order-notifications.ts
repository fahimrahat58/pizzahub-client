"use client";

import { apiFetch } from "@/lib/api";

/** Shared signal so the sidebar badge can react immediately to a mark-as-seen. */
export const VENDOR_ORDER_COUNT_EVENT = "pizzahub:vendor-order-count";

type CountDetail = { count: number };

export const fetchVendorUnseenCount = async (): Promise<number> => {
  const data = await apiFetch<{ success: boolean; count: number }>(
    "/api/orders/vendor/unseen",
  );
  return data.count;
};

export const emitVendorOrderCount = (count: number): void => {
  window.dispatchEvent(
    new CustomEvent<CountDetail>(VENDOR_ORDER_COUNT_EVENT, { detail: { count } }),
  );
};

export const markVendorOrdersSeen = async (): Promise<void> => {
  await apiFetch("/api/orders/vendor/seen", { method: "POST" });
  emitVendorOrderCount(0);
};
