import { Suspense } from "react";

import { SubscriptionSuccess } from "@/components/dashboard/subscription-success";

export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-muted-foreground">
          Checking your subscription...
        </div>
      }
    >
      <SubscriptionSuccess />
    </Suspense>
  );
}
