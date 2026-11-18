import type { ReactNode } from "react";

import { AuthGate } from "@/components/auth/auth-gate";

/**
 * Guards every vendor route in one place so direct URL access cannot bypass
 * the role check. Individual pages only render their own content.
 */
export default function VendorLayout({ children }: { children: ReactNode }) {
  return <AuthGate roles={["vendor"]}>{children}</AuthGate>;
}
