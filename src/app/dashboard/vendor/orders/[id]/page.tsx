import { Suspense } from "react";

import { AuthGate } from "@/components/auth/auth-gate";
import { OrderDetail } from "@/components/dashboard/order-detail";

export default function VendorOrderDetailPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading order...</div>}>
      <AuthGate roles={["vendor"]}>
        <OrderDetail role="vendor" />
      </AuthGate>
    </Suspense>
  );
}
