import { Suspense } from "react";

import { VendorRestaurantsPage } from "@/components/dashboard/vendor-restaurants-page";

export default function VendorRestaurantPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading restaurants...
        </div>
      }
    >
      <VendorRestaurantsPage />
    </Suspense>
  );
}
