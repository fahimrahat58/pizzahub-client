import { Suspense } from "react";

import { AuthGate } from "@/components/auth/auth-gate";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export default function CheckoutRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-muted-foreground">
          Preparing checkout...
        </div>
      }
    >
      <AuthGate roles={["customer"]}>
        <CheckoutForm />
      </AuthGate>
    </Suspense>
  );
}
