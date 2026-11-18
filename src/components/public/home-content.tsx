"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Beef,
  CakeSlice,
  ChefHat,
  Clock3,
  Heart,
  Leaf,
  Pizza,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";

import { PizzaCard, RestaurantCard } from "@/components/public/cards";
import { EmptyState, ErrorState, LinkButton } from "@/components/shared/ui-kit";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { publicApi } from "@/lib/api";
import type { MenuItemDto, RestaurantDto } from "@/lib/types";

const steps = [
  { icon: Search, title: "Find your slice", text: "Browse menus from kitchens near you." },
  { icon: Heart, title: "Save favourites", text: "Keep the pizzas you love one tap away." },
  { icon: Truck, title: "Track delivery", text: "Follow your order from prep to door." },
];

const categories = [
  { name: "Classic Pizzas", icon: Pizza, description: "The timeless favourites" },
  { name: "Vegetarian Pizzas", icon: Leaf, description: "Fresh from the garden" },
  { name: "Meat Lovers", icon: Beef, description: "Loaded with protein" },
  { name: "Specialty / Gourmet Pizzas", icon: Sparkles, description: "Something a little different" },
  { name: "Sides & Appetizers", icon: UtensilsCrossed, description: "Perfect for sharing" },
  { name: "Beverages & Desserts", icon: CakeSlice, description: "Finish on a sweet note" },
];

const benefits = [
  {
    icon: BadgeCheck,
    title: "Only the best kitchens",
    text: "Every restaurant is verified, and every menu item is reviewed before it goes live.",
  },
  {
    icon: ShieldCheck,
    title: "Order with confidence",
    text: "Clear statuses, trusted vendors, and a support team that actually responds.",
  },
  {
    icon: Clock3,
    title: "Live order tracking",
    text: "From the first accept to the final delivery, you always know where your pizza is.",
  },
];

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function HomeContent() {
  const [featured, setFeatured] = useState<MenuItemDto[]>([]);
  const [popular, setPopular] = useState<MenuItemDto[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    let active = true;

    const load = () => {
      setLoading(true);
      setError("");
      Promise.all([
        publicApi<{ success: boolean; items: MenuItemDto[] }>("/api/menu/featured"),
        publicApi<{ success: boolean; items: MenuItemDto[] }>(
          "/api/menu?limit=6&sort=newest",
        ),
        publicApi<{ success: boolean; items: MenuItemDto[] }>(
          "/api/menu?limit=4&sort=rating",
        ),
        publicApi<{ success: boolean; restaurants: RestaurantDto[] }>("/api/restaurants"),
      ])
        .then(([featuredData, publicData, popularData, restaurantData]) => {
          if (!active) return;
          // Featured items come first, then fill up to six with any approved and
          // active items so the section always satisfies the six-item minimum.
          const collected = [...featuredData.items];
          for (const item of publicData.items) {
            if (collected.length >= 8) break;
            if (!collected.some((existing) => existing.id === item.id)) collected.push(item);
          }
          setFeatured(collected.slice(0, 8));
          setPopular(popularData.items);
          setRestaurants(restaurantData.restaurants.slice(0, 3));
        })
        .catch((loadError) => {
          if (!active) return;
          const message =
            loadError instanceof Error ? loadError.message : "Could not load home content";
          setError(message);
          toast.error(message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    load();
    loadRef.current = load;
    return () => {
      active = false;
      loadRef.current = () => undefined;
    };
  }, []);

  return (
    <main className="flex flex-1 flex-col">
      <section className="hero-glow relative overflow-hidden border-b border-border/60">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <Reveal className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
              <Sparkles className="size-3.5" /> Fresh from local kitchens
            </div>
            <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl xl:text-7xl">
              Hot &amp; Fresh Pizza <span className="text-orange-500">Delivered to Your Door</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Discover handcrafted pizzas from independent kitchens, explore six
              delicious categories, and follow every step of your order right to
              your doorstep.
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/menu" size="lg">
                Explore Pizza Menu <ArrowRight className="size-4" />
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
          </Reveal>

          <Reveal className="relative mx-auto w-full max-w-lg" delay={0.1}>
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
          </Reveal>
        </div>
      </section>

      {error ? (
        <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <ErrorState message={error} onRetry={() => loadRef.current()} />
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Editor&apos;s picks</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Featured Menu Items</h2>
          </div>
          <Link href="/menu" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:underline">
            See full menu <ArrowRight className="size-4" />
          </Link>
        </Reveal>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        ) : featured.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((item, index) => (
              <Reveal key={item.id} delay={Math.min(index, 5) * 0.04}>
                <PizzaCard item={item} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState title="Featured pizzas are coming soon" description="Our vendors are firing up the ovens." />
        )}
      </section>

      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Something for everyone</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Pizza Categories</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(({ name, icon: Icon, description }, index) => (
              <Reveal key={name} delay={index * 0.04}>
                <Link
                  href={`/menu?category=${encodeURIComponent(name)}`}
                  className="card-hover group flex h-full items-center gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 transition group-hover:bg-orange-500 group-hover:text-white">
                    <Icon className="size-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{name}</span>
                    <span className="block text-sm text-muted-foreground">{description}</span>
                  </span>
                  <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-orange-500" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">The PizzaHub difference</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Why Choose PizzaHub?</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            We make it easy to discover great local pizza and get it delivered
            without the guesswork.
          </p>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, text }, index) => (
            <Reveal key={title} delay={index * 0.06}>
              <Card className="h-full bg-card/80">
                <CardContent className="space-y-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Simple by design</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">How PizzaHub Works</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.06}>
                <Card className="h-full bg-card/80">
                  <CardContent className="space-y-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                      <Icon className="size-5" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">STEP {index + 1}</p>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Local favourites</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Top rated right now</h2>
          </div>
          <Link href="/menu" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:underline">
            All pizzas <ArrowRight className="size-4" />
          </Link>
        </Reveal>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        ) : popular.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((item, index) => (
              <Reveal key={item.id} delay={Math.min(index, 4) * 0.04}>
                <PizzaCard item={item} />
              </Reveal>
            ))}
          </div>
        ) : null}
      </section>

      {restaurants.length ? (
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <Reveal className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Near you</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Kitchens on PizzaHub</h2>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant, index) => (
              <Reveal key={restaurant.id} delay={index * 0.05}>
                <RestaurantCard restaurant={restaurant} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
