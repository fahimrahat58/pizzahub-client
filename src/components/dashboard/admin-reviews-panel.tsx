"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, EmptyState, ErrorState } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteAdminReview,
  listAdminReviews,
  setAdminReviewHidden,
} from "@/lib/reviews";
import type { ReviewDto } from "@/lib/types";

export function AdminReviewsPanel() {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReviewDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminReviews({ limit: 100, search: search || undefined });
      setReviews(data.reviews);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load reviews for moderation",
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const toggleHidden = async (review: ReviewDto) => {
    setBusy(true);
    try {
      const response = await setAdminReviewHidden(review.id, !review.isHidden);
      toast.success(response.message ?? "Review visibility updated");
      await load();
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error ? toggleError.message : "Could not update review visibility",
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const response = await deleteAdminReview(deleteTarget.id);
      toast.success(response.message);
      setDeleteTarget(null);
      await load();
    } catch (removeError) {
      toast.error(removeError instanceof Error ? removeError.message : "Could not delete review");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(searchInput.trim());
        }}
      >
        <div className="min-w-56 flex-1 space-y-1.5">
          <Label htmlFor="reviewSearch">Search reviews</Label>
          <Input
            id="reviewSearch"
            placeholder="Comment or customer name"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Button type="submit">Search</Button>
        {search ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchInput("");
              setSearch("");
            }}
          >
            Clear
          </Button>
        ) : null}
      </form>

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
                    <p className="font-semibold">{review.productName ?? "Pizza review"}</p>
                    <p className="text-xs text-muted-foreground">
                      {review.customerName ?? review.customerEmail ?? "Customer"} ·{" "}
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.isHidden ? <Badge variant="secondary">Hidden</Badge> : null}
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                      {review.rating}/5
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant={review.isHidden ? "default" : "outline"}
                    disabled={busy}
                    onClick={() => void toggleHidden(review)}
                  >
                    {review.isHidden ? "Restore" : "Hide"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => setDeleteTarget(review)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={search ? "No matching reviews" : "No reviews yet"}
          description={
            search
              ? "Try a different comment or customer name."
              : "Customer reviews will appear here for moderation."
          }
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete review?"
        description="This review will be permanently removed and product ratings will be recalculated."
        confirmLabel="Delete review"
        destructive
        pending={busy}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
