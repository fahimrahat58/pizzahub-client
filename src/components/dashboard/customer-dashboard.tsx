"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Heart, Loader2, Pizza, Truck } from "lucide-react";

import { OrderCard } from "@/components/dashboard/order-card";
import { ProfilePanel } from "@/components/dashboard/profile-panel";
import { PizzaCard } from "@/components/public/cards";
import { EmptyState, ErrorState, LinkButton, PageHeader } from "@/components/shared/ui-kit";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { ListResponse, MenuItemDto, OrderDto } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useHashTab } from "@/lib/use-hash-tab";

const TABS = ["overview", "orders", "favorites", "profile"] as const;
type Tab = (typeof TABS)[number];

const tabLabels: Record<Tab, string> = {
  overview: "Overview",
  orders: "My orders",
  favorites: "Favorites",
  profile: "Profile",
};

export function CustomerDashboard() {
  const [tab, setTab] = useHashTab<Tab>("overview", TABS);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [favorites, setFavorites] = useState<MenuItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [orderData, favoriteData] = await Promise.all([
        apiFetch<{ success: boolean; orders: OrderDto[] }>("/api/orders/my?limit=100"),
        apiFetch<ListResponse<MenuItemDto>>("/api/favorites?limit=100"),
      ]);
      setOrders(orderData.orders);
      setFavorites(favoriteData.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const activeOrders = orders.filter((order) =>
    ["pending", "accepted", "preparing", "out_for_delivery"].includes(order.status),
  );
  const delivered = orders.filter((order) => order.status === "delivered");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Customer workspace"
        title="Hello, pizza lover"
        description="Track your orders, revisit favourite pizzas, and manage your profile."
      />

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
              tab === value && "bg-orange-500/10 text-orange-600 dark:text-orange-400",
            )}
          >
            {tabLabels[value]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading dashboard...
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : tab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Active orders", value: activeOrders.length, icon: Truck },
              { label: "Delivered", value: delivered.length, icon: ClipboardList },
              { label: "Favorites", value: favorites.length, icon: Heart },
              { label: "Total orders", value: orders.length, icon: Pizza },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-4 py-5">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Recent orders</h2>
            {orders.length ? (
              <div className="grid gap-5 xl:grid-cols-2">
                {orders.slice(0, 4).map((order) => (
                  <OrderCard key={order.id} order={order} role="customer" onChanged={() => void load()} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No orders yet"
                description="Find a pizza you love and place your first order."
                action={<LinkButton href="/menu">Explore menu</LinkButton>}
              />
            )}
          </div>
        </div>
      ) : tab === "orders" ? (
        orders.length ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} role="customer" onChanged={() => void load()} />
            ))}
          </div>
        ) : (
          <EmptyState title="No orders yet" description="Your orders will appear here once you place one." />
        )
      ) : tab === "favorites" ? (
        favorites.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((item) => (
              <PizzaCard
                key={item.id}
                item={item}
                favorite={favorites.some((favorite) => favorite.id === item.id)}
                onChanged={() => void load()}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No favorites yet" description="Tap the heart on any pizza to save it here." />
        )
      ) : (
        <ProfilePanel role="customer" />
      )}
    </div>
  );
}
