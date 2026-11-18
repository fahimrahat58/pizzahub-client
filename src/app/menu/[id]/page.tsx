import { Suspense } from "react";

import { MenuDetail } from "@/components/public/menu-detail";

export default function MenuItemPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading pizza...</div>}>
      <MenuDetail />
    </Suspense>
  );
}
