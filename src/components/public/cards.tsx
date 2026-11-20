"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Heart, MapPin, Star, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { loginWithReturn } from "@/lib/safe-return";
import type { MenuItemDto, RestaurantDto } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  itemId,
  initialFavorite = false,
  variant = "icon",
  onChanged,
}: {
  itemId: string;
  initialFavorite?: boolean;
  variant?: "icon" | "full";
  onChanged?: () => void;
}) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Defer the sync so a prop change does not trigger a cascading render.
    queueMicrotask(() => setFavorite(initialFavorite));
  }, [initialFavorite]);

  const toggle = async () => {
    setPending(true);
    try {
      if (favorite) {
        await apiFetch(`/api/favorites/${itemId}`, { method: "DELETE" });
        setFavorite(false);
        toast.success("Removed from favorites");
      } else {
        await apiFetch("/api/favorites", {
          method: "POST",
          body: { menuItemId: itemId },
        });
        setFavorite(true);
        toast.success("Saved to favorites");
      }
      onChanged?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update favorites";
      toast.error(message.includes("sign in") ? "Sign in to save favorites" : message);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggle();
      }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border border-border/70 bg-background/85 px-2.5 py-1.5 text-xs font-medium backdrop-blur-xs transition hover:border-orange-500/60 disabled:opacity-60",
        favorite && "text-orange-500",
        variant === "full" && "h-9 rounded-md px-3 text-sm",
      )}
    >
      <Heart className={cn("size-4", favorite && "fill-current")} />
      {variant === "full" ? (favorite ? "Saved" : "Save") : null}
    </button>
  );
}

export function PizzaCard({
  item,
  favorite,
  onChanged,
}: {
  item: MenuItemDto;
  favorite?: boolean;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  return (
    <article className="card-hover group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <Link href={`/menu/${item.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt={item.name}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute right-3 bottom-3">
            <FavoriteButton
              itemId={item.id}
              initialFavorite={favorite}
              onChanged={onChanged}
            />
          </div>
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {item.vendorPremium ? (
              <Badge className="bg-amber-400 text-amber-950">
                <Crown className="size-3" /> Premium
              </Badge>
            ) : null}
            {item.isFeatured ? (
              <Badge className="bg-orange-500 text-white">Featured</Badge>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/menu/${item.id}`} className="font-semibold hover:text-orange-500">
              {item.name}
            </Link>
            {item.restaurant?.name ? (
              <div className="mt-1 space-y-0.5">
                <Link
                  href={`/restaurants/${item.restaurant.id}`}
                  className="block truncate text-sm font-medium text-foreground/80 hover:text-orange-500 hover:underline"
                >
                  {item.restaurant.name}
                </Link>
                {item.restaurant.address ? (
                  <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="size-3 shrink-0" /> {item.restaurant.address}
                  </span>
                ) : null}
              </div>
            ) : null}
            {item.vendorName ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                by <span className="font-medium text-foreground/80">{item.vendorName}</span>
              </p>
            ) : null}
            {item.location ? (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0" /> {item.location}
              </p>
            ) : null}
          </div>
          <span className="shrink-0 font-bold text-orange-500">${item.price.toFixed(2)}</span>
        </div>
        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
          {item.description}
        </p>
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <Badge variant="secondary">{item.category}</Badge>
          <span
            className="flex items-center gap-1"
            title={`5★ ${item.ratingDistribution["5"]} · 4★ ${item.ratingDistribution["4"]} · 3★ ${item.ratingDistribution["3"]} · 2★ ${item.ratingDistribution["2"]} · 1★ ${item.ratingDistribution["1"]}`}
          >
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {item.ratingAvg.toFixed(1)} ({item.reviewCount})
          </span>
        </div>
        <div className="mt-auto flex gap-2 pt-2">
          <Link
            href={`/menu/${item.id}`}
            onClick={(event) => {
              if (!sessionPending && !session?.user) {
                event.preventDefault();
                router.push(loginWithReturn(`/menu/${item.id}`));
              }
            }}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}
          >
            View Details
          </Link>
          {item.approvalStatus === "approved" && item.isActive ? (
            <AddToCartButton menuItemId={item.id} label="Add" />
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function RestaurantCard({ restaurant }: { restaurant: RestaurantDto }) {
  return (
    <article className="card-hover flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="relative aspect-[4/3] bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="size-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col space-y-2 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-lg font-semibold">
            <Link href={`/restaurants/${restaurant.id}`} className="hover:text-orange-500 hover:underline">
              {restaurant.name}
            </Link>
          </h3>
          {restaurant.vendorPremium ? (
            <Badge className="shrink-0 bg-amber-400 text-amber-950">
              <Crown className="size-3" /> Premium
            </Badge>
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{restaurant.description}</p>
        {!restaurant.isAvailable ? (
          <span className="w-fit rounded-md bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
            Temporarily unavailable
          </span>
        ) : null}
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" /> {restaurant.address}
          </span>
          {restaurant.openingHours ? (
            <span className="flex items-center gap-1">
              <UtensilsCrossed className="size-3.5" /> {restaurant.openingHours}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          {restaurant.ratingAvg.toFixed(1)} ({restaurant.reviewCount})
        </div>
        <Link
          href={`/restaurants/${restaurant.id}`}
          className="mt-auto pt-2 text-sm font-semibold text-orange-500 hover:underline"
        >
          View restaurant →
        </Link>
      </div>
    </article>
  );
}
