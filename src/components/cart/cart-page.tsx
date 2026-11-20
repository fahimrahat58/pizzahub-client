"use client";

import { CartPanel } from "@/components/cart/cart-panel";
import { ClientOnly } from "@/components/shared/client-only";

export function CartPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <ClientOnly
        fallback={
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            Loading your cart...
          </div>
        }
      >
        <CartPanel />
      </ClientOnly>
    </main>
  );
}
