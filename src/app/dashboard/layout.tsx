import { Suspense, type ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth-guards";
import type { UserRole } from "@/lib/types";

async function DashboardAuth({ children }: { children: ReactNode }) {
  const session = await requireUser();
  return (
    <DashboardShell
      role={session.user.role as UserRole}
      userName={session.user.name || session.user.email}
      userImage={session.user.image ?? null}
    >
      {children}
    </DashboardShell>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading your workspace...
        </div>
      }
    >
      <DashboardAuth>{children}</DashboardAuth>
    </Suspense>
  );
}
