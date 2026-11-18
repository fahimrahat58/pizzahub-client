"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  Loader2,
  Pizza,
  Plus,
  Sparkles,
  Store,
} from "lucide-react";

import { ChartCard } from "@/components/dashboard/chart-card";
import {
  ApprovalBadge,
  EmptyState,
  ErrorState,
  LinkButton,
  OrderStatusBadge,
  PageHeader,
} from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { getSubscriptionStatus } from "@/lib/subscriptions";
import type {
  ListResponse,
  MenuItemDto,
  OrderDto,
  RestaurantDto,
  SubscriptionStatusDto,
} from "@/lib/types";

export function VendorOverview() {
  const [menu, setMenu] = useState<MenuItemDto[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [menuData, orderData, restaurantData, subscriptionData] =
        await Promise.all([
          apiFetch<ListResponse<MenuItemDto>>("/api/menu/vendor/mine?limit=100"),
          apiFetch<{ success: boolean; orders: OrderDto[] }>(
            "/api/orders/vendor?limit=100",
          ),
          apiFetch<{
            success: boolean;
            restaurants: RestaurantDto[];
            restaurant: RestaurantDto | null;
          }>("/api/restaurants/mine"),
          getSubscriptionStatus(),
        ]);
      setMenu(menuData.items);
      setOrders(orderData.orders);
      setRestaurants(
        restaurantData.restaurants ??
          (restaurantData.restaurant ? [restaurantData.restaurant] : []),
      );
      setSubscription(subscriptionData.subscription);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading your dashboard...
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  const published = menu.filter(
    (item) => item.isActive && item.approvalStatus === "approved",
  ).length;
  const pendingOrders = orders.filter((order) => order.status === "pending").length;
  const acceptedOrders = orders.filter((order) => order.status === "accepted").length;
  const completedOrders = orders.filter((order) => order.status === "delivered").length;
  const isPremium = subscription?.isPremium === true;
  const menuCountByRestaurant = new Map<string, number>();
  for (const item of menu) {
    if (!item.restaurantId) continue;
    menuCountByRestaurant.set(
      item.restaurantId,
      (menuCountByRestaurant.get(item.restaurantId) ?? 0) + 1,
    );
  }

  const stats = [
    { label: "Restaurants", value: restaurants.length, icon: Store },
    { label: "Menu items", value: menu.length, icon: Pizza },
    { label: "Published", value: published, icon: Eye },
    { label: "Unpublished", value: menu.length - published, icon: EyeOff },
    { label: "Total orders", value: orders.length, icon: ClipboardList },
    { label: "Pending orders", value: pendingOrders, icon: Loader2 },
    { label: "Accepted orders", value: acceptedOrders, icon: CheckCircle2 },
    { label: "Completed orders", value: completedOrders, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vendor workspace"
        title="Your kitchen, your command centre"
        description="A live snapshot of your restaurants, menu, and incoming orders."
      />

      <div className="flex flex-wrap gap-2">
        <LinkButton href="/dashboard/vendor/restaurant?new=1">
          <Plus className="size-4" /> Add Restaurant
        </LinkButton>
        <LinkButton href="/dashboard/vendor/menu?new=1" variant="outline">
          <Pizza className="size-4" /> Add Menu Item
        </LinkButton>
        <LinkButton href="/dashboard/vendor/orders" variant="outline">
          <ClipboardList className="size-4" /> View Orders
        </LinkButton>
        <LinkButton href="/dashboard/vendor/subscription" variant="outline">
          <Sparkles className="size-4" /> Manage Subscription
        </LinkButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
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
        <Card className="border-orange-500/30">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{isPremium ? "Premium" : "Free"}</p>
              <p className="text-xs text-muted-foreground">Current plan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Kitchen activity"
          description="Orders across your current workflow."
          data={[
            { label: "Pending", value: pendingOrders },
            { label: "Accepted", value: acceptedOrders },
            { label: "Preparing", value: orders.filter((order) => order.status === "preparing").length },
            { label: "Out for delivery", value: orders.filter((order) => order.status === "out_for_delivery").length },
            { label: "Delivered", value: completedOrders },
          ]}
        />
        <ChartCard
          title="Menu status"
          description="Published versus unpublished pizzas."
          data={[
            { label: "Published", value: published },
            { label: "Unpublished", value: menu.length - published },
            { label: "Restaurants", value: restaurants.length },
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Recent orders</CardTitle>
            <LinkButton href="/dashboard/vendor/orders" variant="link" size="sm">
              View all
            </LinkButton>
          </CardHeader>
          <CardContent className="space-y-4">
            {orders.length ? (
              orders.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.menuItemSnapshot.name} · {order.customerSnapshot.name}
                    </p>
                    <p className="mt-1 text-xs text-orange-500">
                      {order.restaurantName ??
                        order.menuItemSnapshot.restaurantName ??
                        "Restaurant"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <LinkButton href="/dashboard/vendor/orders" variant="ghost" size="sm">
                      Open
                    </LinkButton>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No orders yet" description="New customer orders will appear here." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Recent menu items</CardTitle>
            <LinkButton href="/dashboard/vendor/menu" variant="link" size="sm">
              View all
            </LinkButton>
          </CardHeader>
          <CardContent className="space-y-4">
            {menu.length ? (
              menu.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.restaurant?.name ?? "Unassigned"} · ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <ApprovalBadge status={item.approvalStatus} />
                    <Badge variant="outline" className="text-[10px]">
                      {item.isActive ? "Published" : "Unpublished"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No menu items yet" description="Add your first pizza to go live." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Restaurant summary</CardTitle>
          <LinkButton href="/dashboard/vendor/restaurant" variant="link" size="sm">
            Manage
          </LinkButton>
        </CardHeader>
        <CardContent>
          {restaurants.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="flex items-center gap-3 rounded-lg border border-border/70 p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="size-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{restaurant.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {restaurant.address}
                    </p>
                    <p className="mt-1 text-xs font-medium text-orange-500">
                      {menuCountByRestaurant.get(restaurant.id) ?? 0} menu item(s)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Store className="size-5" />}
              title="No restaurant yet"
              description="Add your kitchen details before publishing menu items."
              action={
                <LinkButton href="/dashboard/vendor/restaurant?new=1">
                  Add Restaurant
                </LinkButton>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
