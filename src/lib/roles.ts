import type { UserRole } from "@/lib/types";

export const dashboardForRole = (role?: UserRole | string | null): string => {
  if (role === "vendor") return "/dashboard/vendor";
  if (role === "admin") return "/dashboard/admin";
  return "/dashboard/customer";
};
