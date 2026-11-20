import { apiFetch } from "@/lib/api";
import type {
  CartDto,
  CartResponse,
  CheckoutResponse,
  CheckoutStatusResponse,
  PaymentListResponse,
  PaymentStatus,
  PaymentType,
  TransactionDetailResponse,
} from "@/lib/types";

export const EMPTY_CART: CartDto = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  deliveryFee: 0,
  total: 0,
  currency: "usd",
  restaurantId: null,
  restaurantName: null,
};

export type PaymentQuery = {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  type?: PaymentType;
  search?: string;
  sort?: "newest" | "oldest" | "amount_desc" | "amount_asc";
  restaurantId?: string;
};

const queryString = (params: PaymentQuery): string => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.status) search.set("status", params.status);
  if (params.type) search.set("type", params.type);
  if (params.search?.trim()) search.set("search", params.search.trim());
  if (params.sort) search.set("sort", params.sort);
  if (params.restaurantId) search.set("restaurantId", params.restaurantId);
  const value = search.toString();
  return value ? `?${value}` : "";
};

export const getCart = () => apiFetch<CartResponse>("/api/cart");

export const addCartItem = (menuItemId: string, quantity = 1) =>
  apiFetch<CartResponse>("/api/cart", {
    method: "POST",
    body: { menuItemId, quantity },
  });

export const updateCartItem = (menuItemId: string, quantity: number) =>
  apiFetch<CartResponse>(`/api/cart/${encodeURIComponent(menuItemId)}`, {
    method: "PATCH",
    body: { quantity },
  });

export const removeCartItem = (menuItemId: string) =>
  apiFetch<CartResponse>(`/api/cart/${encodeURIComponent(menuItemId)}`, {
    method: "DELETE",
  });

export const clearCart = () =>
  apiFetch<CartResponse>("/api/cart", { method: "DELETE" });

export const createOrderCheckout = (input: {
  deliveryAddress: string;
  deliveryDate: string;
  message?: string;
  idempotencyKey: string;
}) =>
  apiFetch<CheckoutResponse>("/api/payments/checkout", {
    method: "POST",
    body: input,
  });

export const getCheckoutStatus = (sessionId: string) =>
  apiFetch<CheckoutStatusResponse>(
    `/api/payments/session/${encodeURIComponent(sessionId)}`,
  );

export const getMyPayments = (params: PaymentQuery = {}) =>
  apiFetch<PaymentListResponse>(`/api/payments/my${queryString(params)}`);

export const getVendorPayments = (params: PaymentQuery = {}) =>
  apiFetch<PaymentListResponse>(`/api/payments/vendor${queryString(params)}`);

export const getAdminTransactions = (params: PaymentQuery = {}) =>
  apiFetch<PaymentListResponse>(`/api/admin/transactions${queryString(params)}`);

export const getAdminTransaction = (id: string) =>
  apiFetch<TransactionDetailResponse>(
    `/api/admin/transactions/${encodeURIComponent(id)}`,
  );

export const refundAdminTransaction = (
  id: string,
  input: { amount?: number; reason?: string } = {},
) =>
  apiFetch<TransactionDetailResponse>(
    `/api/admin/transactions/${encodeURIComponent(id)}/refund`,
    { method: "POST", body: input },
  );

/** A fresh key per checkout attempt; never reuse a paid attempt. */
export const createCheckoutIdempotencyKey = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

export const formatMoney = (amount: number, currency: string): string => {
  const code = currency.toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
};
