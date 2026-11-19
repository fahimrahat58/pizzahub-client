import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth-guards";
import { dashboardForRole } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

export default async function DashboardIndexPage() {
  const session = await requireUser();
  redirect(dashboardForRole(session.user.role as UserRole));
}
