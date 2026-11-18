import { apiFetch, publicApi } from "@/lib/api";
import type {
  Pagination,
  ReviewDto,
  ReviewListResponse,
  ReviewSummary,
} from "@/lib/types";

export type MyReview = ReviewDto & { productName?: string | null };

type ReviewMutationResponse = {
  success: boolean;
  message?: string;
  review: ReviewDto;
};

export type ReviewQuery = {
  orderId?: string;
  menuItemId?: string;
  page?: number;
  limit?: number;
};

const withQuery = (path: string, params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
};

export const listProductReviews = (menuItemId: string, limit = 20) =>
  publicApi<ReviewListResponse>(`/api/reviews/${menuItemId}?limit=${limit}`);

export const listMyReviews = (params: ReviewQuery = {}) =>
  apiFetch<{
    success: boolean;
    reviews: MyReview[];
    pagination: Pagination;
  }>(withQuery("/api/reviews/mine", params));

export const createProductReview = (body: {
  orderId: string;
  menuItemId: string;
  rating: number;
  comment: string;
}) =>
  apiFetch<ReviewMutationResponse>("/api/reviews", {
    method: "POST",
    body,
  });

export const updateMyReview = (
  id: string,
  body: { rating: number; comment: string },
) =>
  apiFetch<ReviewMutationResponse>(`/api/reviews/mine/${id}`, {
    method: "PATCH",
    body,
  });

export const deleteMyReview = (id: string) =>
  apiFetch<{ success: boolean; message: string }>(`/api/reviews/mine/${id}`, {
    method: "DELETE",
  });

export const listVendorReviews = (params: ReviewQuery = {}) =>
  apiFetch<{ success: boolean; reviews: ReviewDto[]; pagination: Pagination }>(
    withQuery("/api/reviews/vendor", params),
  );

export const listAdminReviews = (params: ReviewQuery & { search?: string } = {}) =>
  apiFetch<{ success: boolean; reviews: ReviewDto[]; pagination: Pagination }>(
    withQuery("/api/admin/reviews", params),
  );

export const setAdminReviewHidden = (id: string, hidden: boolean) =>
  apiFetch<ReviewMutationResponse>(`/api/admin/reviews/${id}/hide`, {
    method: "PATCH",
    body: { hidden },
  });

export const deleteAdminReview = (id: string) =>
  apiFetch<{ success: boolean; message: string }>(`/api/admin/reviews/${id}`, {
    method: "DELETE",
  });

export type { ReviewListResponse, ReviewSummary };
