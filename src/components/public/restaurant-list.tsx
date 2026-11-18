"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { RestaurantCard } from "@/components/public/cards";
import { EmptyState, ErrorState } from "@/components/shared/ui-kit";
import { publicApi } from "@/lib/api";
import type { RestaurantDto } from "@/lib/types";

export function RestaurantList() {
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await publicApi<{ success: boolean; restaurants: RestaurantDto[] }>(
        "/api/restaurants",
      );
      setRestaurants(data.restaurants);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load restaurants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading restaurants...
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!restaurants.length) {
    return <EmptyState title="No restaurants yet" description="Vendor kitchens will appear here once they set up their profile." />;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {restaurants.map((restaurant) => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}
