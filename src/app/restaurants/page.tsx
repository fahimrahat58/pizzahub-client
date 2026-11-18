import type { Metadata } from "next";

import { RestaurantList } from "@/components/public/restaurant-list";
import { PageHeader } from "@/components/shared/ui-kit";

export const metadata: Metadata = {
  title: "Restaurants",
  description: "Discover independent pizza kitchens on PizzaHub.",
};

export default function RestaurantsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Local kitchens"
        title="Restaurants on PizzaHub"
        description="Every kitchen is verified by our admins before its pizzas go live."
      />
      <div className="mt-8">
        <RestaurantList />
      </div>
    </main>
  );
}
