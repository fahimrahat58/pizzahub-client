"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Crown, Loader2, MapPin, Star, Truck } from "lucide-react";
import { toast } from "sonner";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { useCart } from "@/components/cart/cart-provider";
import { FavoriteButton } from "@/components/public/cards";
import { ProductReviews } from "@/components/public/product-reviews";
import { ApprovalBadge, ErrorState, LinkButton, PageHeader } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, publicApi } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type {
  MenuItemDto,
  RestaurantDto,
  RestaurantSummaryDto,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function MenuDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const [item, setItem] = useState<MenuItemDto | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [restaurant, setRestaurant] = useState<RestaurantSummaryDto | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const checkoutPendingRef = useRef(false);
  const { addItem, actionPending } = useCart();

  const loadItem = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const itemResponse = await publicApi<{ success: boolean; item: MenuItemDto }>(
        `/api/menu/${id}`,
      );
      const loadedItem = itemResponse.item;
      setItem(loadedItem);
      setSelectedImage(0);
      setRestaurant(loadedItem.restaurant ?? null);

      if (!loadedItem.restaurant && loadedItem.restaurantId) {
        publicApi<{ success: boolean; restaurant: RestaurantDto }>(
          `/api/restaurants/${loadedItem.restaurantId}`,
        )
          .then((data) =>
            setRestaurant({
              id: data.restaurant.id,
              name: data.restaurant.name,
              address: data.restaurant.address,
              image: data.restaurant.image,
              openingHours: data.restaurant.openingHours,
              isAvailable: data.restaurant.isAvailable,
            }),
          )
          .catch(() => {
            setRestaurant(null);
            toast.warning("Restaurant details could not be loaded.");
          });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load this pizza");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadItem();
  }, [loadItem]);

  // The server guards this route too; this keeps the client state consistent
  // if a session expires while the user is on the page.
  useEffect(() => {
    if (!sessionPending && !session?.user) {
      router.push(`/login?next=${encodeURIComponent(`/menu/${id}`)}`);
    }
  }, [id, router, session?.user, sessionPending]);

  const loadFavoriteIds = useCallback(async () => {
    if (session?.user?.role !== "customer") {
      setFavoriteIds(new Set());
      return;
    }
    try {
      const data = await apiFetch<{ success: boolean; ids: string[] }>("/api/favorites/ids");
      setFavoriteIds(new Set(data.ids));
    } catch {
      setFavoriteIds(new Set());
      toast.error("Could not load your favorites.");
    }
  }, [session?.user?.role]);

  useEffect(() => {
    void loadFavoriteIds();
  }, [loadFavoriteIds, id]);

  const continueToCheckout = async () => {
    if (checkoutPendingRef.current || actionPending) return;
    checkoutPendingRef.current = true;
    setCheckoutPending(true);
    try {
      await addItem(id, quantity);
      setOrderDialogOpen(false);
      toast.success("Added to your cart");
      router.push("/checkout");
    } catch (orderError) {
      toast.error(
        orderError instanceof Error ? orderError.message : "Could not open secure checkout",
      );
    } finally {
      checkoutPendingRef.current = false;
      setCheckoutPending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading pizza...
      </div>
    );
  }
  if (error || !item) return <ErrorState message={error || "Pizza not found"} />;

  const isOrderable =
    item.approvalStatus === "approved" &&
    item.isActive &&
    restaurant?.isAvailable !== false;
  const gallery = item.images?.length ? item.images : [item.image];
  const activeImage = gallery[selectedImage] ?? gallery[0];
  const distribution = item.ratingDistribution;
  const distributionTitle = distribution
    ? `5★ ${distribution["5"]} · 4★ ${distribution["4"]} · 3★ ${distribution["3"]} · 2★ ${distribution["2"]} · 1★ ${distribution["1"]}`
    : undefined;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/menu" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to menu
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/70 bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeImage} alt={item.name} className="size-full object-cover" />
              <div className="absolute top-4 left-4">
                <FavoriteButton
                  itemId={item.id}
                  variant="full"
                  initialFavorite={favoriteIds.has(item.id)}
                  onChanged={() => void loadFavoriteIds()}
                />
              </div>
            </div>
            {gallery.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    aria-label={`View photo ${index + 1}`}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition",
                      index === selectedImage ? "border-orange-500" : "border-transparent hover:border-border",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {item.ingredients.map((ingredient) => (
                <Badge key={ingredient} variant="secondary">{ingredient}</Badge>
              ))}
            </CardContent>
          </Card>

          {restaurant ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    className="hover:text-orange-500 hover:underline"
                  >
                    {restaurant.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5"><MapPin className="size-4" /> {restaurant.address}</p>
                {restaurant.openingHours ? <p>{restaurant.openingHours}</p> : null}
                {!restaurant.isAvailable ? (
                  <p className="font-medium text-destructive">
                    This restaurant is temporarily unavailable for orders.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <PageHeader
              eyebrow={item.category}
              title={item.name}
              description={item.description}
              action={<ApprovalBadge status={item.approvalStatus} />}
            />
            {restaurant ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <Link
                  href={`/restaurants/${restaurant.id}`}
                  className="font-medium text-foreground/80 hover:text-orange-500 hover:underline"
                >
                  {restaurant.name}
                </Link>
                {restaurant.address ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {restaurant.address}
                  </span>
                ) : null}
              </div>
            ) : null}
            {item.vendorName ? (
              <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Sold by{" "}
                  <span className="font-medium text-foreground/80">{item.vendorName}</span>
                </span>
                {item.vendorPremium ? (
                  <Badge className="bg-amber-400 text-amber-950">
                    <Crown className="size-3" /> Premium
                  </Badge>
                ) : null}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-2xl font-bold text-orange-500">${item.price.toFixed(2)}</span>
            <span
              className="flex items-center gap-1 text-muted-foreground"
              title={distributionTitle}
            >
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {item.ratingAvg.toFixed(1)} · {item.reviewCount} reviews
            </span>
          </div>

          {isOrderable ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="size-4 text-orange-500" /> Order this pizza
                </CardTitle>
              </CardHeader>
              <CardContent>
                {session?.user ? (
                  session.user.role === "customer" ? (
                    <>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          className="flex-1"
                          size="lg"
                          onClick={() => setOrderDialogOpen(true)}
                        >
                          Order Now
                        </Button>
                        <AddToCartButton
                          menuItemId={item.id}
                          size="lg"
                          variant="secondary"
                          label="Add to cart"
                          className="flex-1"
                        />
                      </div>
                      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Order this pizza</DialogTitle>
                            <DialogDescription>
                              Choose a quantity. We&apos;ll add it to your cart and open Stripe
                              Checkout for your delivery details and secure payment.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                              id="quantity"
                              type="number"
                              min={1}
                              max={20}
                              value={quantity}
                              onChange={(event) => {
                                const next = Number(event.target.value);
                                setQuantity(Number.isFinite(next) ? Math.min(20, Math.max(1, next)) : 1);
                              }}
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setOrderDialogOpen(false)}
                              disabled={checkoutPending || actionPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={() => void continueToCheckout()}
                              disabled={checkoutPending || actionPending}
                              aria-busy={checkoutPending || actionPending}
                            >
                              {checkoutPending || actionPending ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                              ) : null}
                              Continue to checkout · ${(item.price * quantity).toFixed(2)}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {session.user.role === "vendor"
                        ? "Vendor accounts can't place orders."
                        : "Admin accounts can't place orders."}
                    </p>
                  )
                ) : (
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p>Sign in as a customer to place an order.</p>
                    <LinkButton href="/login" className="w-full">
                      Sign in to order
                    </LinkButton>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                This pizza isn&apos;t available for ordering right now.
              </CardContent>
            </Card>
          )}

          <ProductReviews menuItemId={id} onChanged={() => void loadItem()} />
        </div>
      </div>
    </main>
  );
}
