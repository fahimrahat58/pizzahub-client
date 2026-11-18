import { Suspense } from "react";

import { VendorMenuPage } from "@/components/dashboard/vendor-menu-page";

export default function VendorMenuRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading your menu...
        </div>
      }
    >
      <VendorMenuPage />
    </Suspense>
  );
}
