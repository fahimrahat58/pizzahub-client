"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { authClient } from "@/lib/auth-client";
import {
  addCartItem,
  clearCart,
  EMPTY_CART,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/payment-api";
import type { CartDto } from "@/lib/types";

type CartContextValue = {
  cart: CartDto;
  loading: boolean;
  actionPending: boolean;
  error: string;
  isCustomer: boolean;
  refresh: () => Promise<void>;
  addItem: (menuItemId: string, quantity?: number) => Promise<void>;
  changeQuantity: (menuItemId: string, quantity: number) => Promise<void>;
  removeItem: (menuItemId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : "Could not update your cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const isCustomer =
    !sessionPending &&
    session?.user?.role === "customer" &&
    session.user.isBlocked !== true;

  const [cart, setCart] = useState<CartDto>(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!isCustomer) {
      setCart(EMPTY_CART);
      return;
    }
    try {
      const data = await getCart();
      setCart(data.cart);
      setError("");
    } catch (refreshError) {
      setError(messageOf(refreshError));
    }
  }, [isCustomer]);

  useEffect(() => {
    if (sessionPending) return;
    if (!isCustomer) {
      setCart(EMPTY_CART);
      setError("");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    getCart()
      .then((data) => {
        if (!active) return;
        setCart(data.cart);
        setError("");
      })
      .catch((loadError) => {
        if (!active) return;
        setError(messageOf(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isCustomer, sessionPending]);

  const runMutation = useCallback(
    async (mutation: () => Promise<{ cart: CartDto }>) => {
      setActionPending(true);
      try {
        const data = await mutation();
        setCart(data.cart);
        setError("");
      } finally {
        setActionPending(false);
      }
    },
    [],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      actionPending,
      error,
      isCustomer,
      refresh: () => refresh(),
      addItem: (menuItemId, quantity = 1) =>
        runMutation(() => addCartItem(menuItemId, quantity)),
      changeQuantity: (menuItemId, quantity) =>
        runMutation(() => updateCartItem(menuItemId, quantity)),
      removeItem: (menuItemId) => runMutation(() => removeCartItem(menuItemId)),
      clear: () => runMutation(() => clearCart()),
    }),
    [actionPending, cart, error, isCustomer, loading, refresh, runMutation],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
