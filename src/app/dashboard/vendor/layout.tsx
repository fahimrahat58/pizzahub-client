import { Suspense, type ReactNode } from "react";

import { AuthGate } from "@/components/auth/auth-gate";

/**
 * Guards every vendor route in one place so direct URL access cannot bypass
 * the role check. Individual pages only render their own content.
 */
export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading your workspace...
        </div>
      }
    >
      <AuthGate roles={["vendor"]}>{children}</AuthGate>
    </Suspense>
  );
}
