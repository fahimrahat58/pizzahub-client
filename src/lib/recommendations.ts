import { apiFetch } from "@/lib/api";
import type { TasteDnaResponse } from "@/lib/types";

export const getTasteDna = (limit = 8) =>
  apiFetch<TasteDnaResponse>(`/api/recommendations/taste-dna?limit=${limit}`);
