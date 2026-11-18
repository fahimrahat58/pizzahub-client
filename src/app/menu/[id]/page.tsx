import { Suspense } from "react";

import { MenuDetail } from "@/components/public/menu-detail";
import { requireUser } from "@/lib/auth-guards";

export default async function MenuItemPage() {
  // Item details are private: the proxy handles the fast cookie check and this
  // server guard verifies the live session before any item data is rendered.
  await requireUser();

  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading pizza...</div>}>
      <MenuDetail />
    </Suspense>
  );
}
