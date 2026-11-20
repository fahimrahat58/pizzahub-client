"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";

import { LinkButton, PageHeader } from "@/components/shared/ui-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const IDENTITY_KEY = "pizzahub-checkout-idempotency-key";

export function PaymentCancel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const startNewCheckout = () => {
    // A cancelled session should not be resumed with a stale idempotency key.
    sessionStorage.removeItem(IDENTITY_KEY);
    router.push("/checkout");
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Payment cancelled"
        title="No charge was made"
        description="You left Stripe Checkout before completing this payment."
      />

      <Card className="mt-8">
        <CardContent className="space-y-5 py-8 text-center">
          <XCircle className="mx-auto size-12 text-amber-500" />
          <div>
            <p className="font-medium">Your order is saved, but payment is not confirmed.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cancelling checkout never refunds, cancels, or marks an order as paid. Your cart remains available until Stripe finalises the session.
            </p>
          </div>
          {sessionId ? (
            <p className="font-mono text-xs break-all text-muted-foreground">
              Stripe session: {sessionId}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={startNewCheckout}>Try checkout again</Button>
            <LinkButton href="/cart" variant="outline">Back to cart</LinkButton>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
