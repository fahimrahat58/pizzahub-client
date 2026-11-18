"use client";

import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createProductReview,
  deleteMyReview,
  listMyReviews,
  updateMyReview,
  type MyReview,
} from "@/lib/reviews";
import type { OrderDto } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDto;
  onSaved?: () => void;
};

export function ReviewDialog({ open, onOpenChange, order, onSaved }: Props) {
  const [existing, setExisting] = useState<MyReview | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    void Promise.resolve().then(async () => {
      setLoading(true);
      setError("");
      setConfirmDelete(false);
      try {
        const data = await listMyReviews({ orderId: order.id, limit: 10 });
        const review =
          data.reviews.find((entry) => entry.menuItemId === order.menuItemId) ?? null;
        if (!active) return;
        setExisting(review);
        setRating(review?.rating ?? 5);
        setComment(review?.comment ?? "");
      } catch (loadError) {
        if (!active) return;
        setExisting(null);
        setRating(5);
        setComment("");
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your existing review.",
        );
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [open, order.id, order.menuItemId]);

  const submit = async () => {
    const text = comment.trim();
    if (text.length < 3) {
      setError("Write at least 3 characters about your experience.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      if (existing) {
        await updateMyReview(existing.id, { rating, comment: text });
        toast.success("Review updated");
      } else {
        await createProductReview({
          orderId: order.id,
          menuItemId: order.menuItemId,
          rating,
          comment: text,
        });
        toast.success("Thanks for your review!");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not save your review";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!existing) return;
    setSubmitting(true);
    setError("");
    try {
      await deleteMyReview(existing.id);
      toast.success("Review removed");
      onSaved?.();
      onOpenChange(false);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Could not remove your review";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Edit your review" : "Write a Review"}</DialogTitle>
          <DialogDescription>
            Your rating for {order.menuItemSnapshot.name} from order {order.orderNumber}.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading your review...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1" role="radiogroup" aria-label="Product rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    onClick={() => setRating(value)}
                    className="rounded-md p-1 transition hover:bg-muted"
                  >
                    <Star
                      className={cn(
                        "size-7",
                        value <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-comment">Your review</Label>
              <Textarea
                id="review-comment"
                value={comment}
                maxLength={1000}
                rows={4}
                placeholder="What did you think of this pizza?"
                onChange={(event) => setComment(event.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {confirmDelete ? (
              <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <p className="text-sm">Remove this review permanently?</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={submitting}
                    onClick={() => void remove()}
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                    Yes, remove
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={submitting}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Keep it
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          {existing && !confirmDelete ? (
            <Button
              type="button"
              variant="ghost"
              disabled={loading || submitting}
              onClick={() => setConfirmDelete(true)}
            >
              Remove
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading || submitting || confirmDelete}
            onClick={() => void submit()}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {existing ? "Update review" : "Submit review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
