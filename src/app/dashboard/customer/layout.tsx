import { Suspense, type ReactNode } from "react";

import { AuthGate } from "@/components/auth/auth-gate";

/** Guards every customer route, including direct links to nested pages. */
export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading your workspace...
        </div>
      }
    >
      <AuthGate roles={["customer"]}>{children}</AuthGate>
    </Suspense>
  );
}
