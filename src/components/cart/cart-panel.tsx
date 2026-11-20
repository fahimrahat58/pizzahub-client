"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/components/cart/cart-provider";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LinkButton,
  PageHeader,
} from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/payment-api";
import { cn } from "@/lib/utils";

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : "Could not update your cart";

/**
 * The only cart UI. Both /cart and the customer dashboard render this panel,
 * so quantity, removal, totals and checkout always come from CartProvider.
 */
export function CartPanel({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const { cart, loading, error, actionPending, changeQuantity, removeItem, clear, refresh } =
    useCart();
  const [clearOpen, setClearOpen] = useState(false);
  const [busyItem, setBusyItem] = useState<string | null>(null);

  const mutate = async (menuItemId: string, action: () => Promise<void>) => {
    setBusyItem(menuItemId);
    try {
      await action();
    } catch (mutateError) {
      toast.error(messageOf(mutateError));
    } finally {
      setBusyItem(null);
    }
  };

  return (
    <div className={cn("w-full space-y-6", !embedded && "mx-auto max-w-6xl")}>
      <PageHeader
        eyebrow="Your order"
        title="Shopping cart"
        description="Prices are confirmed from the restaurant before checkout. One restaurant per order."
        action={<LinkButton href="/menu" variant="outline">Browse menu</LinkButton>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="size-5 text-primary" />
              {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
            </CardTitle>
            {cart.items.length ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={actionPending}
                onClick={() => setClearOpen(true)}
              >
                <Trash2 className="size-4" /> Clear cart
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-14 text-muted-foreground">
                <Loader2 className="mr-2 size-5 animate-spin" /> Loading your cart...
              </div>
            ) : error ? (
              <ErrorState message={error} onRetry={() => void refresh()} />
            ) : cart.items.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="size-5" />}
                title="Your cart is empty"
                description="Add a pizza from the menu to get started. Your previous orders stay in My Orders."
                action={<LinkButton href="/menu">Explore the menu</LinkButton>}
              />
            ) : (
              <div className="divide-y divide-border/70">
                {cart.restaurantName ? (
                  <p className="pb-4 text-sm text-muted-foreground">
                    Restaurant: <span className="font-medium text-foreground">{cart.restaurantName}</span>
                  </p>
                ) : null}
                {cart.items.map((item) => {
                  const busy = busyItem === item.menuItemId;
                  return (
                    <div key={item.menuItemId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-20 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.restaurantName ?? item.vendorName}
                            </p>
                          </div>
                          <p className="font-semibold text-primary">
                            {formatMoney(item.lineTotal, cart.currency)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {formatMoney(item.unitPrice, cart.currency)} each
                          </Badge>
                          <div className="flex items-center gap-1 rounded-lg border border-border">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Decrease quantity of ${item.name}`}
                              disabled={busy || item.quantity <= 1}
                              onClick={() =>
                                void mutate(item.menuItemId, () =>
                                  changeQuantity(item.menuItemId, item.quantity - 1),
                                )
                              }
                            >
                              <Minus className="size-3.5" />
                            </Button>
                            <span className="w-7 text-center text-sm font-medium">
                              {busy ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : item.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Increase quantity of ${item.name}`}
                              disabled={busy || item.quantity >= 20}
                              onClick={() =>
                                void mutate(item.menuItemId, () =>
                                  changeQuantity(item.menuItemId, item.quantity + 1),
                                )
                              }
                            >
                              <Plus className="size-3.5" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            disabled={busy}
                            onClick={() =>
                              void mutate(item.menuItemId, () => removeItem(item.menuItemId))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(cart.subtotal, cart.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery charge</span>
              <span>{formatMoney(cart.deliveryFee, cart.currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Other fees</span>
              <span>{formatMoney(0, cart.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-border/70 pt-4 text-lg font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatMoney(cart.total, cart.currency)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={!cart.items.length || loading}
              onClick={() => router.push("/checkout")}
            >
              Continue to checkout
            </Button>
            <Link
              href="/dashboard/customer#orders"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              View my orders
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              Payment is processed securely by Stripe. Your cart is cleared only after payment is
              confirmed.
            </p>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear your cart?"
        description="All items will be removed. This cannot be undone."
        confirmLabel="Clear cart"
        destructive
        pending={actionPending}
        onConfirm={() => {
          void clear()
            .then(() => {
              setClearOpen(false);
              toast.success("Cart cleared");
            })
            .catch((clearError) => toast.error(messageOf(clearError)));
        }}
      />
    </div>
  );
}
