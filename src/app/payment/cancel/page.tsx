import { Suspense } from "react";

import { AuthGate } from "@/components/auth/auth-gate";
import { PaymentCancel } from "@/components/payments/payment-cancel";

// The customer auth check gates the whole route and may redirect to login, so this
// route intentionally blocks instead of rendering a static shell first.
export const instant = false;

export default function PaymentCancelPage() {
  return (
    <AuthGate roles={["customer"]}>
      <Suspense
        fallback={
          <div className="py-20 text-center text-sm text-muted-foreground">
            Loading checkout result...
          </div>
        }
      >
        <PaymentCancel />
      </Suspense>
    </AuthGate>
  );
}
