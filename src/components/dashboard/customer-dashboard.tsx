"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, ClipboardList, Heart, Loader2 } from "lucide-react";

import { CartPanel } from "@/components/cart/cart-panel";
import { ChartCard, orderStatusChartColor } from "@/components/dashboard/chart-card";
import { DashboardOverviewSkeleton } from "@/components/dashboard/dashboard-overview-skeleton";
import { OrderCard } from "@/components/dashboard/order-card";
import { PaymentHistory } from "@/components/payments/payment-history";
import { ProfilePanel } from "@/components/dashboard/profile-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { PizzaCard } from "@/components/public/cards";
import { ClientOnly } from "@/components/shared/client-only";
import { EmptyState, ErrorState, LinkButton, PageHeader } from "@/components/shared/ui-kit";
import { apiFetch } from "@/lib/api";
import type {
  DashboardSummary,
  DashboardSummaryResponse,
  ListResponse,
  MenuItemDto,
  OrderDto,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useHashTab } from "@/lib/use-hash-tab";

const TABS = ["overview", "cart", "orders", "payments", "favorites", "taste-dna", "profile"] as const;
type Tab = (typeof TABS)[number];

const tabLabels: Record<Tab, string> = {
  overview: "Overview",
  cart: "Cart",
  orders: "My orders",
  payments: "Payment history",
  favorites: "Favorites",
  "taste-dna": "Taste DNA",
  profile: "Profile",
};

const TasteDnaPanel = dynamic(
  () => import("@/components/dashboard/taste-dna-panel").then((mod) => mod.TasteDnaPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading Taste DNA...
      </div>
    ),
  },
);

export function CustomerDashboard() {
  const [tab, setTab] = useHashTab<Tab>("overview", TABS);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [favorites, setFavorites] = useState<MenuItemDto[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [orderData, favoriteData, summaryData] = await Promise.all([
        apiFetch<{ success: boolean; orders: OrderDto[] }>("/api/orders/my?limit=50"),
        apiFetch<ListResponse<MenuItemDto>>("/api/favorites?limit=50"),
        apiFetch<DashboardSummaryResponse>("/api/dashboard/summary"),
      ]);
      setOrders(orderData.orders);
      setFavorites(favoriteData.items);
      setSummary(summaryData.summary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

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
              tab === value && "bg-primary/10 text-primary",
            )}
          >
            {tabLabels[value]}
          </button>
        ))}
      </div>

      {tab === "cart" ? (
        <ClientOnly
          fallback={
            <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" /> Loading your cart...
            </div>
          }
        >
          <CartPanel embedded />
        </ClientOnly>
      ) : tab === "payments" ? (
        <PaymentHistory />
      ) : loading ? (
        <DashboardOverviewSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : !summary ? (
        <ErrorState message="Your dashboard summary is unavailable." onRetry={() => void load()} />
      ) : tab === "taste-dna" ? (
        <TasteDnaPanel favoriteIds={favorites.map((item) => item.id)} onChanged={() => void load()} />
      ) : tab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total orders"
              value={summary.stats.totalOrders}
              icon={ClipboardList}
            />
            <StatCard
              label="Pending orders"
              value={summary.stats.pendingOrders}
              icon={Loader2}
            />
            <StatCard
              label="Completed orders"
              value={summary.stats.completedOrders}
              icon={CheckCircle2}
            />
            <StatCard
              label="Favorite items"
              value={summary.stats.favorites ?? favorites.length}
              icon={Heart}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="Order activity"
              description="Orders placed over the last 7 days."
              data={summary.charts.orderTrend}
              variant="line"
              emptyMessage="No orders in the last 7 days"
            />
            <ChartCard
              title="Order status"
              description="All of your orders by current status."
              data={summary.charts.orderStatus}
              variant="donut"
              colorForPoint={orderStatusChartColor}
              showEmptyData
              emptyMessage="No orders yet"
            />
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
