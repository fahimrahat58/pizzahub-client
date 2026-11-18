import { Suspense } from "react";

import { RestaurantDetail } from "@/components/public/restaurant-detail";

export default function RestaurantPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading restaurant...</div>}>
      <RestaurantDetail />
    </Suspense>
  );
}
