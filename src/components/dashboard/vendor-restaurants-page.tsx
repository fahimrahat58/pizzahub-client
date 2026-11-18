"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Pencil, Plus, Store, Trash2 } from "lucide-react";

import { DeleteRestaurantDialog } from "@/components/dashboard/delete-restaurant-dialog";
import { MenuFormDialog } from "@/components/dashboard/menu-form-dialog";
import { RestaurantFormDialog } from "@/components/dashboard/restaurant-form-dialog";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shared/ui-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type {
  ListResponse,
  MenuItemDto,
  RestaurantDto,
} from "@/lib/types";

export function VendorRestaurantsPage() {
  const searchParams = useSearchParams();
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [menu, setMenu] = useState<MenuItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantDto | null>(null);
  const [deleting, setDeleting] = useState<RestaurantDto | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const autoOpened = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [restaurantData, menuData] = await Promise.all([
        apiFetch<{
          success: boolean;
          restaurants: RestaurantDto[];
          restaurant: RestaurantDto | null;
        }>("/api/restaurants/mine"),
        apiFetch<ListResponse<MenuItemDto>>("/api/menu/vendor/mine?limit=100"),
      ]);
      setRestaurants(
        restaurantData.restaurants ??
          (restaurantData.restaurant ? [restaurantData.restaurant] : []),
      );
      setMenu(menuData.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load restaurants",
      );
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
  const openEdit = (restaurant: RestaurantDto) => {
    setEditing(restaurant);
    setFormOpen(true);
  };

  const menuCount = (restaurantId: string) =>
    menu.filter((item) => item.restaurantId === restaurantId).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading restaurants...
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vendor workspace"
        title="My Restaurant"
        description="Manage every kitchen you own. Each restaurant has its own public page and menu."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add Restaurant
          </Button>
        }
      />

      {restaurants.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id} className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="aspect-[16/7] w-full object-cover"
              />
              <CardContent className="space-y-3">
                <div>
                  <h3 className="truncate text-lg font-semibold">{restaurant.name}</h3>
                  <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                </div>
                <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                  {restaurant.description}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-muted px-2 py-1 font-medium">
                    {menuCount(restaurant.id)} menu item(s)
                  </span>
                  {restaurant.phone ? (
                    <span className="rounded-md bg-muted px-2 py-1">{restaurant.phone}</span>
                  ) : null}
                  {restaurant.openingHours ? (
                    <span className="rounded-md bg-muted px-2 py-1">
                      {restaurant.openingHours}
                    </span>
                  ) : null}
                </div>
                <a
                  href={`/restaurants/${restaurant.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs font-semibold text-orange-500 hover:underline"
                >
                  View public page ↗
                </a>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => setMenuFor(restaurant.id)}>
                    <Plus className="size-3.5" /> Add Menu
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(restaurant)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleting(restaurant)}>
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Store className="size-5" />}
          title="No restaurant yet"
          description="Add your kitchen details so customers can find you and your menu items can go live."
          action={<Button onClick={openCreate}>Add Restaurant</Button>}
        />
      )}

      <RestaurantFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        restaurant={editing}
        onSaved={() => void load()}
      />
      <DeleteRestaurantDialog
        restaurant={deleting}
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => void load()}
      />
      <MenuFormDialog
        open={menuFor !== null}
        onOpenChange={(open) => !open && setMenuFor(null)}
        restaurants={restaurants}
        defaultRestaurantId={menuFor}
        onSaved={() => void load()}
      />
    </div>
  );
}
