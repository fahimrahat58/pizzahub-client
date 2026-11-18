import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth-guards";
import type { UserRole } from "@/lib/types";

export async function AuthGate({
  roles,
  children,
}: {
  roles?: UserRole[];
  children: ReactNode;
}) {
  await requireUser(roles);
  return <>{children}</>;
}
