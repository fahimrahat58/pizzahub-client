"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MapPin, Star, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FavoriteButton } from "@/components/public/cards";
import { ApprovalBadge, ErrorState, LinkButton, PageHeader } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, publicApi } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type {
  MenuItemDto,
  OrderDto,
  RestaurantDto,
  RestaurantSummaryDto,
  ReviewDto,
} from "@/lib/types";

type ReviewWithAuthor = ReviewDto & { authorName: string; authorImage: string | null };

const orderSchema = z.object({
  quantity: z.number().int().min(1).max(20),
  deliveryAddress: z.string().trim().min(10, "Enter a complete delivery address").max(300),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a delivery date"),
  message: z.string().trim().max(500).optional(),
});

const reviewSchema = z.object({
  orderId: z.string().min(1, "Select a delivered order"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3, "Add a short comment").max(1000),
});

export function MenuDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const { data: session } = authClient.useSession();

  const [item, setItem] = useState<MenuItemDto | null>(null);
  const [reviews, setReviews] = useState<ReviewWithAuthor[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantSummaryDto | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [deliveredOrders, setDeliveredOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const orderForm = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      quantity: 1,
      deliveryAddress: "",
      deliveryDate: new Date().toISOString().slice(0, 10),
      message: "",
    },
  });

  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { orderId: "", rating: 5, comment: "" },
  });

  const loadItem = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [itemResponse, reviewsResponse] = await Promise.all([
        publicApi<{ success: boolean; item: MenuItemDto }>(`/api/menu/${id}`),
        publicApi<{ success: boolean; reviews: ReviewWithAuthor[] }>(
          `/api/reviews/${id}?limit=20`,
        ),
      ]);
      const loadedItem = itemResponse.item;
      setItem(loadedItem);
      setReviews(reviewsResponse.reviews);
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
            }),
          )
          .catch(() => setRestaurant(null));
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

  useEffect(() => {
    if (session?.user?.role !== "customer") return;
    apiFetch<{ success: boolean; orders: OrderDto[] }>("/api/orders/my?limit=100")
      .then((data) =>
        setDeliveredOrders(
          data.orders.filter(
            (order) => order.status === "delivered" && order.menuItemId === id,
          ),
        ),
      )
      .catch(() => setDeliveredOrders([]));
  }, [id, session?.user?.role]);

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
    }
  }, [session?.user?.role]);

  useEffect(() => {
    void loadFavoriteIds();
  }, [loadFavoriteIds, id]);

  const availableOrders = useMemo(() => {
    const reviewedOrderIds = new Set(reviews.map((review) => review.orderId));
    return deliveredOrders.filter((order) => !reviewedOrderIds.has(order.id));
  }, [deliveredOrders, reviews]);

  const placeOrder = async (values: z.infer<typeof orderSchema>) => {
    try {
      await apiFetch("/api/orders", {
        method: "POST",
        body: {
          menuItemId: id,
          quantity: values.quantity,
          deliveryAddress: values.deliveryAddress,
          deliveryDate: values.deliveryDate,
          message: values.message ?? "",
        },
      });
      toast.success("Order placed! Track it in your dashboard.");
      router.push("/dashboard/customer");
    } catch (orderError) {
      toast.error(orderError instanceof Error ? orderError.message : "Could not place order");
    }
  };

  const submitReview = async (values: z.infer<typeof reviewSchema>) => {
    try {
      await apiFetch("/api/reviews", {
        method: "POST",
        body: { ...values, menuItemId: id },
      });
      toast.success("Thanks for your review!");
      reviewForm.reset({ orderId: "", rating: 5, comment: "" });
      await loadItem();
    } catch (reviewError) {
      toast.error(reviewError instanceof Error ? reviewError.message : "Could not publish review");
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

  const isOrderable = item.approvalStatus === "approved" && item.isActive;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/menu" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to menu
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/70 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.name} className="size-full object-cover" />
            <div className="absolute top-4 left-4">
              <FavoriteButton
                itemId={item.id}
                variant="full"
                initialFavorite={favoriteIds.has(item.id)}
                onChanged={() => void loadFavoriteIds()}
              />
            </div>
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
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-2xl font-bold text-orange-500">${item.price.toFixed(2)}</span>
            <span className="flex items-center gap-1 text-muted-foreground">
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
                    <form
                      onSubmit={orderForm.handleSubmit((values) => void placeOrder(values))}
                      className="space-y-4"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min={1}
                            max={20}
                            {...orderForm.register("quantity", { valueAsNumber: true })}
                          />
                          {orderForm.formState.errors.quantity ? (
                            <p className="text-xs text-destructive">
                              {orderForm.formState.errors.quantity.message}
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deliveryDate">Delivery date</Label>
                          <Input id="deliveryDate" type="date" {...orderForm.register("deliveryDate")} />
                          {orderForm.formState.errors.deliveryDate ? (
                            <p className="text-xs text-destructive">
                              {orderForm.formState.errors.deliveryDate.message}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deliveryAddress">Delivery address</Label>
                        <Textarea
                          id="deliveryAddress"
                          placeholder="Street, city, and any delivery notes"
                          {...orderForm.register("deliveryAddress")}
                        />
                        {orderForm.formState.errors.deliveryAddress ? (
                          <p className="text-xs text-destructive">
                            {orderForm.formState.errors.deliveryAddress.message}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message for the kitchen (optional)</Label>
                        <Input id="message" placeholder="Extra sauce please!" {...orderForm.register("message")} />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={orderForm.formState.isSubmitting}
                      >
                        {orderForm.formState.isSubmitting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        Place order · ${(item.price * orderForm.watch("quantity")).toFixed(2)}
                      </Button>
                    </form>
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

          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {reviews.length ? (
                reviews.map((review) => (
                  <div key={review.id} className="space-y-1 border-b border-border/70 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{review.authorName}</span>
                      <span className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: review.rating }).map((_, index) => (
                          <Star key={index} className="size-3.5 fill-current" />
                        ))}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
              )}

              {session?.user?.role === "customer" && availableOrders.length ? (
                <form
                  onSubmit={reviewForm.handleSubmit((values) => void submitReview(values))}
                  className="space-y-3 rounded-xl border border-border bg-muted/20 p-4"
                >
                  <p className="text-sm font-semibold">Review a delivered order</p>
                  <div className="space-y-2">
                    <Label htmlFor="reviewOrder">Order</Label>
                    <select
                      id="reviewOrder"
                      className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
                      {...reviewForm.register("orderId")}
                    >
                      <option value="">Select an order</option>
                      {availableOrders.map((order) => (
                        <option key={order.id} value={order.id}>
                          {order.orderNumber} · {new Date(order.deliveryDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating</Label>
                    <select
                      id="rating"
                      className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
                      {...reviewForm.register("rating", { valueAsNumber: true })}
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>{value} stars</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment">Your review</Label>
                    <Textarea id="comment" placeholder="How was it?" {...reviewForm.register("comment")} />
                    {reviewForm.formState.errors.comment ? (
                      <p className="text-xs text-destructive">{reviewForm.formState.errors.comment.message}</p>
                    ) : null}
                  </div>
                  <Button type="submit" disabled={reviewForm.formState.isSubmitting}>
                    {reviewForm.formState.isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Publish review
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
