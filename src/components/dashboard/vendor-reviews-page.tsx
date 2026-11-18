"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";

import { EmptyState, ErrorState, PageHeader } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listVendorReviews } from "@/lib/reviews";
import type { ReviewDto } from "@/lib/types";

export function VendorReviewsPage() {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listVendorReviews({ limit: 100 });
      setReviews(data.reviews);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load customer reviews",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vendor dashboard"
        title="Customer reviews"
        description="Feedback left by customers on delivered orders of your pizzas."
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading reviews...
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : reviews.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="space-y-2 py-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{review.productName ?? "Pizza"}</p>
                    <p className="text-xs text-muted-foreground">
                      {review.authorName ?? review.customerName ?? "Pizza lover"} ·{" "}
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.isHidden ? <Badge variant="secondary">Hidden by admin</Badge> : null}
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                      {review.rating}/5
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No reviews yet"
          description="Reviews for your delivered pizzas will appear here."
        />
      )}
    </div>
  );
}
