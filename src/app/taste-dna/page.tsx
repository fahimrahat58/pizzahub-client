import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthGate } from "@/components/auth/auth-gate";
import { TasteDnaView } from "@/components/dashboard/taste-dna-view";

export const metadata: Metadata = {
  title: "Taste DNA | PizzaHub",
  description: "Pizza recommendations built from your own PizzaHub activity.",
};

export default function TasteDnaPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading your taste profile...
        </div>
      }
    >
      <AuthGate roles={["customer"]}>
        <TasteDnaView />
      </AuthGate>
    </Suspense>
  );
}
