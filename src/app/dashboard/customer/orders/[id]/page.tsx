import { Suspense } from "react";

import { AuthGate } from "@/components/auth/auth-gate";
import { OrderDetail } from "@/components/dashboard/order-detail";

export default function CustomerOrderDetailPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading order...</div>}>
      <AuthGate roles={["customer"]}>
        <OrderDetail role="customer" />
      </AuthGate>
    </Suspense>
  );
}
