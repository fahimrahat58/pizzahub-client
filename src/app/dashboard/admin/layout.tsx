import { Suspense, type ReactNode } from "react";

import { AuthGate } from "@/components/auth/auth-gate";

/** Guards every admin route, including direct links to nested pages. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading your workspace...
        </div>
      }
    >
      <AuthGate roles={["admin"]}>{children}</AuthGate>
    </Suspense>
  );
}
