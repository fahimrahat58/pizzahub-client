"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";

import { PizzaCard } from "@/components/public/cards";
import { EmptyState, ErrorState, PaginationControls } from "@/components/shared/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicApi, apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { ListResponse, MenuItemDto, RestaurantDto } from "@/lib/types";

type Filters = {
  search: string;
  category: string;
  sort: string;
  vendorId: string;
  restaurantId: string;
};

const PAGE_SIZE = 12;

export function MenuBrowser() {
  const { data: session } = authClient.useSession();
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "",
    sort: "newest",
    vendorId: "",
    restaurantId: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [items, setItems] = useState<MenuItemDto[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    queueMicrotask(() => {
      setFilters((current) => ({
        ...current,
        vendorId: params.get("vendorId") ?? "",
        restaurantId: params.get("restaurantId") ?? "",
      }));
      setReady(true);
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    publicApi<{ success: boolean; categories: string[] }>("/api/menu/categories")
      .then((data) => setCategories(data.categories))
      .catch(() => setCategories([]));
    publicApi<{ success: boolean; restaurants: RestaurantDto[] }>(
      "/api/restaurants?limit=50",
    )
      .then((data) => setRestaurants(data.restaurants))
      .catch(() => setRestaurants([]));
  }, []);

  useEffect(() => {
    if (session?.user?.role !== "customer") {
      queueMicrotask(() => setFavorites(new Set()));
      return;
    }
    apiFetch<{ success: boolean; ids: string[] }>("/api/favorites/ids")
      .then((data) => setFavorites(new Set(data.ids)))
      .catch(() => setFavorites(new Set()));
  }, [session?.user?.role]);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort: filters.sort,
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.category) params.set("category", filters.category);
    if (filters.vendorId) params.set("vendorId", filters.vendorId);
    if (filters.restaurantId) params.set("restaurantId", filters.restaurantId);
    return params.toString();
  }, [
    debouncedSearch,
    filters.category,
    filters.sort,
    filters.vendorId,
    filters.restaurantId,
    page,
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await publicApi<ListResponse<MenuItemDto>>(`/api/menu?${query}`);
      setItems(data.items);
      setPagination(data.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the menu");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (ready) void Promise.resolve().then(load);
  }, [load, ready]);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="search">Search pizzas</Label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                className="pl-9"
                placeholder="Name, ingredient, or description"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={filters.category}
              onChange={(event) => updateFilter("category", event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant">Restaurant</Label>
            <select
              id="restaurant"
              value={filters.restaurantId}
              onChange={(event) => updateFilter("restaurantId", event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">All restaurants</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort">Sort by</Label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(event) => updateFilter("sort", event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="newest">Newest</option>
              <option value="rating">Top rated</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                search: "",
                category: "",
                sort: "newest",
                vendorId: "",
                restaurantId: "",
              });
              setDebouncedSearch("");
              setPage(1);
            }}
          >
            <SlidersHorizontal className="size-4" /> Reset
          </Button>
        </div>
        {filters.vendorId || filters.restaurantId ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Showing pizzas from one restaurant. Use Reset to see everything.
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading pizzas...
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No pizzas found"
          description="Try a different search or category."
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {pagination.total} {pagination.total === 1 ? "pizza" : "pizzas"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <PizzaCard key={item.id} item={item} favorite={favorites.has(item.id)} />
            ))}
          </div>
          <PaginationControls
            page={pagination.page}
            pages={pagination.pages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
