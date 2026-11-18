"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/shared/ui-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { apiFetch, publicApi } from "@/lib/api";
import type { OrderDto, RestaurantDto, ReviewDto } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  restaurant: RestaurantDto;
  menuItemIds: string[];
  onReviewAdded: () => void;
};

export function RestaurantReviews({ restaurant, menuItemIds, onReviewAdded }: Props) {
  const { data: session } = authClient.useSession();
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [orderId, setOrderId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await publicApi<{ success: boolean; reviews: ReviewDto[] }>(
        `/api/reviews/restaurant/${restaurant.id}?limit=20`,
      );
      setReviews(data.reviews);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load restaurant reviews");
    } finally {
      setLoading(false);
    }
  }, [restaurant.id]);

  useEffect(() => {
    void Promise.resolve().then(loadReviews);
  }, [loadReviews]);

  useEffect(() => {
    if (session?.user?.role !== "customer") return;
    let active = true;
    apiFetch<{ success: boolean; orders: OrderDto[] }>("/api/orders/my?limit=100")
      .then((data) => {
        if (active) setOrders(data.orders);
      })
      .catch(() => {
        // A missing/blocked session simply hides the review form.
        if (active) setOrders([]);
      });
    return () => {
      active = false;
    };
  }, [session?.user?.role]);

  const eligibleOrders = useMemo(() => {
    const ids = new Set(menuItemIds);
    return orders.filter(
      (order) =>
        order.status === "delivered" &&
        (ids.has(order.menuItemId) ||
          order.restaurantName === restaurant.name ||
          order.menuItemSnapshot.restaurantName === restaurant.name),
    );
  }, [orders, menuItemIds, restaurant.name]);

  const activeOrderId = eligibleOrders.some((order) => order.id === orderId)
    ? orderId
    : (eligibleOrders[0]?.id ?? "");

  const submit = async () => {
    if (!activeOrderId) {
      setFormError("Select a delivered order from this restaurant.");
      return;
    }
    if (comment.trim().length < 3) {
      setFormError("Write at least 3 characters about your experience.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await apiFetch(`/api/reviews/restaurant/${restaurant.id}`, {
        method: "POST",
        body: { orderId: activeOrderId, rating, comment: comment.trim() },
      });
      toast.success("Thanks for reviewing this restaurant");
      setComment("");
      await loadReviews();
      onReviewAdded();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not publish review";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-lg">Restaurant reviews</CardTitle>
        <div className="flex items-center gap-1 text-sm font-semibold">
          <Star className="size-4 fill-amber-400 text-amber-400" />
          {restaurant.ratingAvg.toFixed(1)}
          <span className="font-normal text-muted-foreground">({restaurant.reviewCount})</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {session?.user?.role === "customer" ? (
          eligibleOrders.length ? (
            <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4">
              <p className="text-sm font-medium">Rate your experience</p>
              <div className="flex gap-1" role="radiogroup" aria-label="Restaurant rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    onClick={() => setRating(value)}
                    className="rounded-md p-1 transition hover:bg-background"
                  >
                    <Star
                      className={cn(
                        "size-6",
                        value <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                      )}
                    />
                  </button>
                ))}
              </div>
              <select
                value={activeOrderId}
                onChange={(event) => setOrderId(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                aria-label="Delivered order"
              >
                {eligibleOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber} — {order.menuItemSnapshot.name}
                  </option>
                ))}
              </select>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Tell other pizza lovers about this kitchen..."
                rows={3}
                className="w-full rounded-md border border-input bg-background p-3 text-sm"
              />
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
              <Button size="sm" disabled={submitting} onClick={() => void submit()}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Publish review
              </Button>
            </div>
          ) : (
            <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
              Complete a delivered order from this restaurant to leave a review.
            </p>
          )
        ) : (
          <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
            Sign in as a customer to review this restaurant.
          </p>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading reviews...
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => void loadReviews()} />
        ) : reviews.length ? (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-border/70 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{review.authorName ?? "Pizza lover"}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {review.rating}/5
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No reviews yet" description="Be the first to share your experience." />
        )}
      </CardContent>
    </Card>
  );
}
