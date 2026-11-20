import { Suspense } from "react";

import { AuthGate } from "@/components/auth/auth-gate";
import { PaymentSuccess } from "@/components/payments/payment-success";

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-muted-foreground">
          Checking your payment status...
        </div>
      }
    >
      <AuthGate roles={["customer"]}>
        <PaymentSuccess />
      </AuthGate>
    </Suspense>
  );
}
