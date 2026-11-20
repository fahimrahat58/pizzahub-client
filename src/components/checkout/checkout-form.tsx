"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Loader2, LockKeyhole, ShoppingCart } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCart } from "@/components/cart/cart-provider";
import { EmptyState, PageHeader } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import {
  createCheckoutIdempotencyKey,
  createOrderCheckout,
  formatMoney,
} from "@/lib/payment-api";
import { cn } from "@/lib/utils";

const IDENTITY_KEY = "pizzahub-checkout-idempotency-key";

const localToday = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const checkoutSchema = z.object({
  deliveryAddress: z.string().trim().min(10, "Enter a complete delivery address").max(300),
  deliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a delivery date")
    .refine((value) => value >= localToday(), "Delivery date must be today or later"),
  message: z.string().trim().max(500, "Keep your note under 500 characters").optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { cart, loading, error: cartError, refresh } = useCart();
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createCheckoutIdempotencyKey(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submittingRef = useRef(false);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryAddress: "",
      deliveryDate: localToday(),
      message: "",
    },
  });

  useEffect(() => {
    // A key from an earlier payment attempt must never follow the customer
    // into a new checkout. Each page load starts with its own in-memory key.
    sessionStorage.removeItem(IDENTITY_KEY);
  }, []);

  useEffect(() => {
    // Back/forward cache restores the old component with refs intact. Reset the
    // local guard; the server-side checkout key still prevents a second charge.
    const onPageShow = () => {
      submittingRef.current = false;
      setSubmitting(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const submit = async (values: CheckoutValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await createOrderCheckout({
        deliveryAddress: values.deliveryAddress,
        deliveryDate: values.deliveryDate,
        message: values.message ?? "",
        idempotencyKey,
      });
      if (result.paymentStatus === "paid") {
        // The payment was already verified; never reopen a completed Stripe
        // Checkout Session. The success page reads status from the API.
        sessionStorage.removeItem(IDENTITY_KEY);
        router.push(
          `/payment/success?session_id=${encodeURIComponent(result.sessionId)}`,
        );
        return;
      }
      if (!result.checkoutUrl) {
        throw new Error("Stripe did not return a checkout URL. Please try again.");
      }
      window.location.assign(result.checkoutUrl);
    } catch (submitFailure) {
      const message =
        submitFailure instanceof Error ? submitFailure.message : "Could not start checkout";
      setSubmitError(message);
      // A paid order is terminal; rotating the key there could create a second
      // charge. Only expired/unavailable attempts get a fresh in-memory key.
      if (/expired|start a new checkout|no longer available/i.test(message)) {
        const freshKey = createCheckoutIdempotencyKey();
        sessionStorage.removeItem(IDENTITY_KEY);
        setIdempotencyKey(freshKey);
      }
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (sessionPending || loading || !idempotencyKey) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-6xl items-center justify-center px-4">
        <Loader2 className="mr-2 size-5 animate-spin text-muted-foreground" /> Preparing checkout...
      </main>
    );
  }

  const isCustomer =
    session?.user?.role === "customer" && session.user.isBlocked !== true;

  if (!isCustomer) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <EmptyState
          title="Customer sign-in required"
          description="Sign in with a customer account to check out."
          action={
            <Link href="/login?next=/checkout" className={cn(buttonVariants())}>
              Sign in
            </Link>
          }
        />
      </main>
    );
  }

  if (!cart.items.length) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <EmptyState
          icon={<ShoppingCart className="size-5" />}
          title="Your cart is empty"
          description="Add a pizza before starting checkout."
          action={<Link href="/menu" className={cn(buttonVariants())}>Browse menu</Link>}
        />
      </main>
    );
  }

  const busy = submitting || form.formState.isSubmitting;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Secure checkout"
        title="Complete your order"
        description="Review your items and delivery details. Payment is handled by Stripe."
        action={<Badge variant="outline"><LockKeyhole className="mr-1 size-3" /> Test mode</Badge>}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <form onSubmit={form.handleSubmit((values) => void submit(values))} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer & delivery details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="customer-name">Name</Label>
                  <Input id="customer-name" value={session.user.name} readOnly />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customer-email">Email</Label>
                  <Input id="customer-email" value={session.user.email} readOnly />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deliveryAddress">Delivery address</Label>
                <Textarea
                  id="deliveryAddress"
                  placeholder="Street, city, and any delivery notes"
                  {...form.register("deliveryAddress")}
                />
                {form.formState.errors.deliveryAddress ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.deliveryAddress.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deliveryDate">Delivery date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  min={localToday()}
                  {...form.register("deliveryDate")}
                />
                {form.formState.errors.deliveryDate ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.deliveryDate.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message for the kitchen (optional)</Label>
                <Textarea
                  id="message"
                  maxLength={500}
                  placeholder="Extra sauce please!"
                  {...form.register("message")}
                />
                {form.formState.errors.message ? (
                  <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
                <CreditCard className="size-5 text-primary" />
                <div>
                  <p className="font-medium">Card — Stripe Checkout</p>
                  <p className="text-xs text-muted-foreground">
                    You will enter card details on Stripe&apos;s secure page. Use test card 4242 4242 4242 4242.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {submitError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}
          {cartError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {cartError}
              <button
                type="button"
                className="ml-2 font-semibold underline"
                onClick={() => void refresh()}
              >
                Retry
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" disabled={busy} aria-busy={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <LockKeyhole className="mr-2 size-4" />}
              {busy ? "Opening secure checkout..." : `Pay ${formatMoney(cart.total, cart.currency)}`}
            </Button>
            <Link href="/cart" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Back to cart
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Your order is created before redirecting. Payment status is only confirmed by a verified Stripe webhook.
          </p>
        </form>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <p className="font-medium">{cart.restaurantName ?? "Restaurant"}</p>
              <p className="text-xs text-muted-foreground">{cart.items.length} line items</p>
            </div>
            <div className="divide-y divide-border/70">
              {cart.items.map((item) => (
                <div key={item.menuItemId} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty {item.quantity} × {formatMoney(item.unitPrice, cart.currency)}
                    </p>
                  </div>
                  <span className="whitespace-nowrap font-medium">
                    {formatMoney(item.lineTotal, cart.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-border/70 pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatMoney(cart.subtotal, cart.currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery fee</span>
                <span>{formatMoney(cart.deliveryFee, cart.currency)}</span>
              </div>
              <div className="flex justify-between pt-2 text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatMoney(cart.total, cart.currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
