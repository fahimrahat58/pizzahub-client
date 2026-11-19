"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Crown, Loader2, MapPin, Phone, Star } from "lucide-react";

import { PizzaCard } from "@/components/public/cards";
import { RestaurantReviews } from "@/components/public/restaurant-reviews";
import { EmptyState, ErrorState } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { publicApi } from "@/lib/api";
import type { ListResponse, MenuItemDto, RestaurantDto } from "@/lib/types";

export function RestaurantDetail() {
  const params = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<RestaurantDto | null>(null);
  const [items, setItems] = useState<MenuItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshRating = async () => {
    const data = await publicApi<{ success: boolean; restaurant: RestaurantDto }>(
      `/api/restaurants/${params.id}`,
    );
    setRestaurant(data.restaurant);
  };

  useEffect(() => {
    let active = true;
    queueMicrotask(() => setLoading(true));
    publicApi<{ success: boolean; restaurant: RestaurantDto }>(`/api/restaurants/${params.id}`)
      .then(async (data) => {
        if (!active) return;
        setRestaurant(data.restaurant);
        const menu = await publicApi<ListResponse<MenuItemDto>>(
          `/api/menu?restaurantId=${data.restaurant.id}&limit=50`,
        );
        if (active) setItems(menu.items);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load restaurant");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading restaurant...
      </div>
    );
  }
  if (error || !restaurant) return <ErrorState message={error || "Restaurant not found"} />;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/restaurants" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All restaurants
      </Link>

      <div className="relative mb-10 aspect-[21/9] overflow-hidden rounded-2xl border border-border/70 bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={restaurant.image} alt={restaurant.name} className="size-full object-cover" />
      </div>

      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">{restaurant.name}</h1>
            {restaurant.vendorPremium ? (
              <Badge className="bg-amber-400 text-amber-950">
                <Crown className="size-3" /> Premium
              </Badge>
            ) : null}
          </div>
          <p className="max-w-2xl text-muted-foreground">{restaurant.description}</p>
          {!restaurant.isAvailable ? (
            <span className="inline-flex rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
              Temporarily unavailable
            </span>
          ) : null}
          <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {restaurant.address}</span>
            <span className="flex items-center gap-1.5"><Phone className="size-4" /> {restaurant.phone}</span>
            {restaurant.openingHours ? <span>{restaurant.openingHours}</span> : null}
            <span className="flex items-center gap-1">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {restaurant.ratingAvg.toFixed(1)} ({restaurant.reviewCount} reviews)
            </span>
          </div>
        </div>
      </div>

      <h2 className="mb-5 text-2xl font-semibold">Menu from this kitchen</h2>
      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => <PizzaCard key={item.id} item={item} />)}
        </div>
      ) : (
        <EmptyState title="No live pizzas yet" description="This kitchen is preparing its menu." />
      )}

      <div className="mt-12">
        <RestaurantReviews
          restaurant={restaurant}
          menuItemIds={items.map((item) => item.id)}
          onReviewAdded={() => void refreshRating().catch(() => undefined)}
        />
      </div>
    </main>
  );
}
