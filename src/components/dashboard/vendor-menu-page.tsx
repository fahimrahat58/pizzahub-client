"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Pencil, Plus, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeleteMenuDialog } from "@/components/dashboard/delete-menu-dialog";
import { MenuFormDialog } from "@/components/dashboard/menu-form-dialog";
import {
  ApprovalBadge,
  EmptyState,
  ErrorState,
  LinkButton,
  PageHeader,
} from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { getSubscriptionStatus } from "@/lib/subscriptions";
import type {
  ListResponse,
  MenuItemDto,
  RestaurantDto,
  SubscriptionStatusDto,
} from "@/lib/types";

export function VendorMenuPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<MenuItemDto[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItemDto | null>(null);
  const [deleting, setDeleting] = useState<MenuItemDto | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const autoOpened = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [menuData, restaurantData, subscriptionData] = await Promise.all([
        // No restaurant filter: the vendor sees every item across all kitchens.
        apiFetch<ListResponse<MenuItemDto>>("/api/menu/vendor/mine?limit=100"),
        apiFetch<{
          success: boolean;
          restaurants: RestaurantDto[];
          restaurant: RestaurantDto | null;
        }>("/api/restaurants/mine"),
        getSubscriptionStatus(),
      ]);
      setItems(menuData.items);
      setRestaurants(
        restaurantData.restaurants ??
          (restaurantData.restaurant ? [restaurantData.restaurant] : []),
      );
      setSubscription(subscriptionData.subscription);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your menu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  useEffect(() => {
    if (searchParams.get("new") === "1" && !autoOpened.current) {
      autoOpened.current = true;
      setEditing(null);
      setFormOpen(true);
    }
  }, [searchParams]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const toggleActive = async (item: MenuItemDto) => {
    if (busyId) return;
    setBusyId(item.id);
    try {
      await apiFetch(`/api/menu/vendor/${item.id}/active`, {
        method: "PATCH",
        body: { isActive: !item.isActive },
      });
      toast.success(item.isActive ? "Pizza unpublished" : "Pizza published");
      await load();
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error ? toggleError.message : "Could not update status",
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading menu...
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  const activeCount = items.filter(
    (item) => item.isActive && item.approvalStatus === "approved",
  ).length;
  const limit = subscription?.activeItemLimit ?? 3;
  const planNote = subscription?.isPremium
    ? `Premium plan · ${activeCount} active item(s), unlimited allowed.`
    : `Free plan · ${activeCount} of ${limit} active items used.`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vendor workspace"
        title="My Menu"
        description={`All pizzas across your restaurants, with their real restaurant names. ${planNote}`}
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/dashboard/vendor/subscription" variant="outline">
              View plans
            </LinkButton>
            <Button onClick={openCreate} disabled={restaurants.length === 0}>
              <Plus className="size-4" /> Add Menu Item
            </Button>
          </div>
        }
      />

      {restaurants.length === 0 ? (
        <EmptyState
          icon={<Store className="size-5" />}
          title="Create a restaurant first"
          description="Every menu item must belong to one of your restaurants."
          action={
            <LinkButton href="/dashboard/vendor/restaurant?new=1">
              Add Restaurant
            </LinkButton>
          }
        />
      ) : items.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="relative aspect-[4/3] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="size-full object-cover" />
                <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                  <ApprovalBadge status={item.approvalStatus} />
                  <Badge variant="outline" className="bg-background/80">
                    {item.isActive ? "Published" : "Unpublished"}
                  </Badge>
                </div>
              </div>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{item.name}</h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.category} · {item.restaurant?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <span className="font-bold text-orange-500">${item.price.toFixed(2)}</span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(item.createdAt).toLocaleDateString()}
                </p>
                {item.rejectionReason && item.approvalStatus === "rejected" ? (
                  <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                    {item.rejectionReason}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(item); setFormOpen(true); }}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === item.id}
                    onClick={() => void toggleActive(item)}
                  >
                    {item.isActive ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleting(item)}>
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Your menu is empty"
          description="Add your first pizza. New items are published immediately."
          action={<Button onClick={openCreate}><Plus className="size-4" /> Add Menu Item</Button>}
        />
      )}

      <MenuFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        restaurants={restaurants}
        item={editing}
        onSaved={() => void load()}
      />
      <DeleteMenuDialog
        item={deleting}
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => void load()}
      />
    </div>
  );
}
