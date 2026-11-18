"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChefHat, Heart, Search, Sparkles, Truck } from "lucide-react";

import { PizzaCard, RestaurantCard } from "@/components/public/cards";
import { EmptyState } from "@/components/shared/ui-kit";
import { LinkButton } from "@/components/shared/ui-kit";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { publicApi } from "@/lib/api";
import type { MenuItemDto, RestaurantDto } from "@/lib/types";

const steps = [
  { icon: Search, title: "Find your slice", text: "Browse menus from kitchens near you." },
  { icon: Heart, title: "Save favourites", text: "Keep the pizzas you love one tap away." },
  { icon: Truck, title: "Track delivery", text: "Follow your order from prep to door." },
];

export function HomeContent() {
  const [featured, setFeatured] = useState<MenuItemDto[]>([]);
  const [popular, setPopular] = useState<MenuItemDto[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      publicApi<{ success: boolean; items: MenuItemDto[] }>("/api/menu/featured"),
      publicApi<{ success: boolean; items: MenuItemDto[] }>(
        "/api/menu?limit=4&sort=rating",
      ),
      publicApi<{ success: boolean; restaurants: RestaurantDto[] }>("/api/restaurants"),
    ])
      .then(([featuredData, popularData, restaurantData]) => {
        if (!active) return;
        setFeatured(featuredData.items);
        setPopular(popularData.items);
        setRestaurants(restaurantData.restaurants.slice(0, 3));
      })
      .catch(() => {
        if (active) {
          setFeatured([]);
          setPopular([]);
          setRestaurants([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex flex-1 flex-col">
      <section className="hero-glow relative overflow-hidden border-b border-border/60">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
              <Sparkles className="size-3.5" /> Fresh from local kitchens
            </div>
            <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl xl:text-7xl">
              Crave it. Order it. <span className="text-orange-500">Love it.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Discover handcrafted pizzas, follow every step of your order, and
              support the independent kitchens that make your neighbourhood taste
              better.
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/menu" size="lg">
                Explore the menu <ArrowRight className="size-4" />
              </LinkButton>
              <LinkButton href="/register?role=vendor" size="lg" variant="outline">
                <ChefHat className="size-4" /> Join as a vendor
              </LinkButton>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-4 text-sm text-muted-foreground">
              <span><strong className="text-foreground">100+</strong> pizzas</span>
              <span><strong className="text-foreground">4.8/5</strong> average rating</span>
              <span><strong className="text-foreground">Live</strong> order tracking</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-border/70 bg-muted shadow-2xl shadow-orange-500/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80"
                alt="Freshly baked pizza"
                className="size-full object-cover"
              />
              <div className="absolute right-4 bottom-4 left-4 rounded-2xl border border-white/20 bg-black/60 p-4 text-white backdrop-blur-md">
                <p className="text-xs uppercase tracking-widest text-orange-300">Today&apos;s pick</p>
                <p className="mt-1 text-lg font-semibold">Truffle Mushroom Special</p>
                <p className="text-sm text-white/70">From our featured kitchens</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Editor&apos;s picks</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Featured pizzas</h2>
          </div>
          <Link href="/menu" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:underline">
            See full menu <ArrowRight className="size-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : featured.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item) => <PizzaCard key={item.id} item={item} />)}
          </div>
        ) : (
          <EmptyState title="Featured pizzas are coming soon" description="Our vendors are firing up the ovens." />
        )}
      </section>

      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <Card key={title} className="bg-card/80">
                <CardContent className="space-y-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                    <Icon className="size-5" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">STEP {index + 1}</p>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Local favourites</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Top rated right now</h2>
          </div>
          <Link href="/restaurants" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:underline">
            All restaurants <ArrowRight className="size-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : popular.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((item) => <PizzaCard key={item.id} item={item} />)}
          </div>
        ) : null}
      </section>

      {restaurants.length ? (
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Near you</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Kitchens on PizzaHub</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
