import { Suspense } from "react";

import { VendorSubscriptionPanel } from "@/components/dashboard/vendor-subscription-panel";

export default function VendorSubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading plans...
        </div>
      }
    >
      <VendorSubscriptionPanel />
    </Suspense>
  );
}
