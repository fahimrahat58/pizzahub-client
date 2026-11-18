"use client";

import { ArrowLeft, ShoppingCart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton, PageHeader } from "@/components/shared/ui-kit";

export function SubscriptionCancel() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Vendor billing"
        title="Checkout canceled"
        description="No charge was made and your current plan has not changed."
      />
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-orange-500">
            <ShoppingCart className="size-7" />
          </div>
          <CardTitle className="text-xl">You can try again whenever you like</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            Your existing subscription and menu items are untouched. Return to the pricing page to choose monthly or yearly Premium billing.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <LinkButton href="/dashboard/vendor/subscription">
              Back to pricing <ArrowLeft className="size-4" />
            </LinkButton>
            <LinkButton href="/dashboard/vendor" variant="outline">
              Return to dashboard
            </LinkButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
