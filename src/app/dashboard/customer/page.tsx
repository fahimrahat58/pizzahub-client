import { Suspense } from "react";

import { AuthGate } from "@/components/auth/auth-gate";
import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>}>
      <AuthGate roles={["customer"]}>
        <CustomerDashboard />
      </AuthGate>
    </Suspense>
  );
}
