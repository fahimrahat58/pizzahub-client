import { Suspense } from "react";

import { AuthGate } from "@/components/auth/auth-gate";
import { CartPage } from "@/components/cart/cart-page";

export default function CartRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading your cart...
        </div>
      }
    >
      <AuthGate roles={["customer"]}>
        <CartPage />
      </AuthGate>
    </Suspense>
  );
}
