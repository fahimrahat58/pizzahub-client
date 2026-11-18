"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Star } from "lucide-react";

import { ReviewDialog } from "@/components/public/review-dialog";
import { EmptyState, ErrorState } from "@/components/shared/ui-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { listMyReviews, listProductReviews, type MyReview } from "@/lib/reviews";
import type {
  OrderDto,
  RatingDistribution,
  ReviewDto,
  ReviewSummary,
} from "@/lib/types";

type Props = {
  menuItemId: string;
  onChanged?: () => void;
};

const STAR_LEVELS: (keyof RatingDistribution)[] = ["5", "4", "3", "2", "1"];

export function ProductReviews({ menuItemId, onChanged }: Props) {
  const { data: session } = authClient.useSession();
  const isCustomer = session?.user?.role === "customer";

  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOrder, setDialogOrder] = useState<OrderDto | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [publicData, ownData, orderData] = await Promise.all([
        listProductReviews(menuItemId, 50),
        isCustomer
          ? listMyReviews({ menuItemId, limit: 100 })
          : Promise.resolve({ reviews: [] as MyReview[] }),
        isCustomer
          ? apiFetch<{ success: boolean; orders: OrderDto[] }>("/api/orders/my?limit=100")
          : Promise.resolve({ orders: [] as OrderDto[] }),
      ]);
      setReviews(publicData.reviews);
      setSummary(publicData.summary ?? null);
      setMyReviews(ownData.reviews);
      setOrders(orderData.orders);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load product reviews",
      );
    } finally {
      setLoading(false);
    }
  }, [isCustomer, menuItemId]);

  useEffect(() => {
    void Promise.resolve().then(reload);
  }, [reload]);

  const eligibleOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "delivered" && order.menuItemId === menuItemId,
      ),
    [orders, menuItemId],
  );

  const distribution = summary?.ratingDistribution;
  const maxCount = distribution ? Math.max(...STAR_LEVELS.map((key) => distribution[key])) : 0;

  const saved = () => {
    void reload();
    onChanged?.();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Reviews</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary?.reviewCount ?? reviews.length} verified reviews from delivered orders
          </p>
        </div>
        {summary ? (
          <div className="flex items-center gap-1 text-lg font-semibold">
            <Star className="size-5 fill-amber-400 text-amber-400" />
            {summary.ratingAvg.toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground">/ 5</span>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        {distribution && maxCount > 0 ? (
          <div className="grid gap-1.5 rounded-xl border border-border/70 bg-muted/20 p-3">
            {STAR_LEVELS.map((level) => (
              <div key={level} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-8 shrink-0">{level} ★</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${(distribution[level] / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-5 text-right">{distribution[level]}</span>
              </div>
            ))}
          </div>
        ) : null}

        {isCustomer ? (
          <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4">
            <p className="text-sm font-medium">Review your delivered orders</p>
            {eligibleOrders.length ? (
              eligibleOrders.map((order) => {
                const own = myReviews.find((review) => review.orderId === order.id);
                return (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {order.orderNumber} ·{" "}
                      {new Date(order.deliveryDate).toLocaleDateString()}
                    </span>
                    <Button size="sm" variant="secondary" onClick={() => setDialogOrder(order)}>
                      {own ? "Edit review" : "Write a Review"}
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete a delivered order for this pizza to leave a review.
              </p>
            )}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading reviews...
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => void reload()} />
        ) : reviews.length ? (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-border/70 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    {review.authorName ?? review.customerName ?? "Pizza lover"}
                  </p>
                  <span className="flex items-center gap-0.5 text-amber-500" aria-label={`${review.rating} stars`}>
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star key={index} className="size-3.5 fill-current" />
                    ))}
                  </span>
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

      {dialogOrder ? (
        <ReviewDialog
          open={dialogOrder !== null}
          onOpenChange={(open) => !open && setDialogOrder(null)}
          order={dialogOrder}
          onSaved={saved}
        />
      ) : null}
    </Card>
  );
}
