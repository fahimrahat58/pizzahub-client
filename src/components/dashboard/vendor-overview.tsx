"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Crown,
  Loader2,
  Pizza,
  Plus,
  Sparkles,
  Store,
} from "lucide-react";

import { ChartCard } from "@/components/dashboard/chart-card";
import { DashboardOverviewSkeleton } from "@/components/dashboard/dashboard-overview-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
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
import {
  billingIntervalLabel,
  getPurchasedBillingInterval,
  getSubscriptionStatus,
} from "@/lib/subscriptions";
import type {
  DashboardSummary,
  DashboardSummaryResponse,
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
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [menuData, orderData, restaurantData, subscriptionData, summaryData] =
        await Promise.all([
          apiFetch<ListResponse<MenuItemDto>>("/api/menu/vendor/mine?limit=50"),
          apiFetch<{ success: boolean; orders: OrderDto[] }>(
            "/api/orders/vendor?limit=50",
          ),
          apiFetch<{
            success: boolean;
            restaurants: RestaurantDto[];
            restaurant: RestaurantDto | null;
          }>("/api/restaurants/mine"),
          getSubscriptionStatus(),
          apiFetch<DashboardSummaryResponse>("/api/dashboard/summary"),
        ]);
      setMenu(menuData.items);
      setOrders(orderData.orders);
      setSummary(summaryData.summary);
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

  if (loading) return <DashboardOverviewSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!summary) {
    return (
      <ErrorState message="Your dashboard summary is unavailable." onRetry={() => void load()} />
    );
  }

  const isPremium = subscription?.isPremium === true;
  const purchasedCycleLabel = isPremium
    ? billingIntervalLabel(getPurchasedBillingInterval(subscription))
    : null;
  const menuCountByRestaurant = new Map<string, number>();
  for (const item of menu) {
    if (!item.restaurantId) continue;
    menuCountByRestaurant.set(
      item.restaurantId,
      (menuCountByRestaurant.get(item.restaurantId) ?? 0) + 1,
    );
  }

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
        <LinkButton
          href="/dashboard/vendor/subscription"
          variant={isPremium ? "outline" : "default"}
        >
          {isPremium ? (
            <Sparkles className="size-4" />
          ) : (
            <Crown className="size-4" />
          )}
          {isPremium ? "Manage Subscription" : "Upgrade to Premium"}
        </LinkButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Restaurants" value={summary.stats.totalRestaurants ?? restaurants.length} icon={Store} />
        <StatCard label="Active menu items" value={summary.stats.activeMenuItems ?? 0} icon={Pizza} />
        <StatCard label="Total orders" value={summary.stats.totalOrders} icon={ClipboardList} />
        <StatCard label="Pending orders" value={summary.stats.pendingOrders} icon={Loader2} />
        <StatCard label="Completed orders" value={summary.stats.completedOrders} icon={CheckCircle2} />
        <Card className="min-w-0 border-primary/30">
          <CardContent className="flex items-start gap-3 p-4 sm:p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {isPremium ? <Sparkles className="size-5" /> : <Crown className="size-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-2xl font-bold">
                  {isPremium ? "Premium" : "Free"}
                  {purchasedCycleLabel ? (
                    <span className="ml-2 text-sm font-medium text-primary">
                      {purchasedCycleLabel}
                    </span>
                  ) : null}
                </p>
                {isPremium ? (
                  <Badge className="bg-amber-400 text-amber-950">
                    <Crown className="size-3" /> Premium vendor
                  </Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Current plan</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {isPremium
                  ? "Unlimited active items · Premium badge · Featured placement"
                  : "3 active items · Upgrade for unlimited items and featured placement"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="Order activity"
          description="Orders received over the last 7 days."
          data={summary.charts.orderTrend}
          variant="line"
          emptyMessage="No orders in the last 7 days"
        />
        <ChartCard
          title="Order status"
          description="All of your orders by current status."
          data={summary.charts.orderStatus}
          variant="donut"
          emptyMessage="No orders yet"
        />
        <ChartCard
          title="Order value"
          description="Value of orders received over the last 7 days."
          data={summary.charts.orderValueTrend ?? []}
          variant="line"
          formatValue={(value) => `$${value.toFixed(2)}`}
          emptyMessage="No order value yet"
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
                    <p className="mt-1 text-xs text-primary">
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
                    <p className="mt-1 text-xs font-medium text-primary">
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
