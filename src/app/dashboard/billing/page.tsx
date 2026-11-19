import { Suspense } from "react";

import { AuthGate } from "@/components/auth/auth-gate";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>}>
      <AuthGate roles={["admin"]}>
        <AdminDashboard initialTab="billing" />
      </AuthGate>
    </Suspense>
  );
}
