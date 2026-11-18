import type { UserRole } from "@/lib/types";

export const normalizeRole = (role?: UserRole | string | null): UserRole => {
  if (role === "vendor" || role === "admin" || role === "customer") return role;
  return "customer";
};

export const dashboardForRole = (role?: UserRole | string | null): string => {
  const normalized = normalizeRole(role);
  if (normalized === "vendor") return "/dashboard/vendor";
  if (normalized === "admin") return "/dashboard/admin";
  return "/dashboard/customer";
};
