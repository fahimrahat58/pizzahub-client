"use client";

import { useEffect, useSyncExternalStore } from "react";

import { apiFetch } from "@/lib/api";

/** Kept for compatibility with any existing listeners of count changes. */
export const VENDOR_ORDER_COUNT_EVENT = "pizzahub:vendor-order-count";

type CountDetail = { count: number };

/**
 * One shared count for every consumer (navbar, dashboard sidebar, etc.).
 * Only the first enabled consumer starts polling; later consumers subscribe to
 * the same store, so no duplicate API requests are introduced.
 */
let currentCount = 0;
let countRevision = 0;
let activeConsumers = 0;
let inFlightRefresh: Promise<void> | null = null;
let stopPolling: (() => void) | null = null;
const listeners = new Set<() => void>();

const notify = (): void => {
  listeners.forEach((listener) => listener());
};

const setCount = (count: number): void => {
  currentCount = count;
  // Invalidates poll responses that started before a mark-as-seen update.
  countRevision += 1;
  notify();
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<CountDetail>(VENDOR_ORDER_COUNT_EVENT, { detail: { count } }),
    );
  }
};

export const fetchVendorUnseenCount = async (): Promise<number> => {
  const data = await apiFetch<{ success: boolean; count: number }>(
    "/api/orders/vendor/unseen",
  );
  return data.count;
};

/** Updates the shared count and notifies every mounted consumer. */
export const emitVendorOrderCount = (count: number): void => {
  setCount(count);
};

const refreshCount = (): Promise<void> => {
  if (inFlightRefresh) return inFlightRefresh;

  const startedRevision = countRevision;
  inFlightRefresh = (async () => {
    try {
      const count = await fetchVendorUnseenCount();
      if (countRevision === startedRevision) setCount(count);
    } catch {
      // Keep the last known count when the API is temporarily unavailable.
    } finally {
      inFlightRefresh = null;
    }
  })();
  return inFlightRefresh;
};

const startPolling = (): void => {
  if (stopPolling) return;

  void refreshCount();
  const onFocus = () => void refreshCount();
  const onVisibility = () => {
    if (document.visibilityState === "visible") void refreshCount();
  };
  const timer = window.setInterval(() => void refreshCount(), 20_000);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility);

  stopPolling = () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisibility);
    stopPolling = null;
  };
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): number => currentCount;
const getServerSnapshot = (): number => 0;

/** Returns the shared unseen-order count for a vendor; zero for other roles. */
export function useVendorOrderCount(enabled: boolean): number {
  const count = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!enabled) return;

    activeConsumers += 1;
    startPolling();

    return () => {
      activeConsumers = Math.max(0, activeConsumers - 1);
      if (activeConsumers > 0) return;

      stopPolling?.();
      // A signed-out or switched account must never inherit the old count.
      setCount(0);
    };
  }, [enabled]);

  return enabled ? count : 0;
}

export const markVendorOrdersSeen = async (): Promise<void> => {
  const data = await apiFetch<{ success: boolean; count?: number }>(
    "/api/orders/vendor/seen",
    { method: "POST" },
  );
  // The server returns the post-update count so an order that arrived while
  // this request was in flight is not briefly hidden by a hard-coded zero.
  setCount(data.count ?? 0);
};
