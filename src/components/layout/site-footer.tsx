"use client";

import Link from "next/link";

import { CurrentYear } from "@/components/layout/current-year";
import { Brand } from "@/components/shared/ui-kit";
import { authClient } from "@/lib/auth-client";
import { emitDashboardHash } from "@/lib/dashboard-hash";
import { dashboardForRole } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

export function SiteFooter() {
  const { data: session, isPending } = authClient.useSession();
  const role = session?.user?.role as UserRole | undefined;
  const dashboard = dashboardForRole(role);

  return (
    <footer className="mt-auto border-t border-border/70 bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="space-y-3">
          <Brand />
          <p className="max-w-xs text-sm text-muted-foreground">
            Handcrafted pizzas, local kitchens, and a ordering experience worth
            coming back to.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Explore</h3>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link href="/menu" className="hover:text-foreground">Full menu</Link>
            <Link href="/restaurants" className="hover:text-foreground">Restaurants</Link>
            <Link href="/register?role=vendor" className="hover:text-foreground">
              Become a vendor
            </Link>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Account</h3>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            {isPending ? (
              <>
                <span className="h-4 w-20 animate-pulse rounded bg-muted" />
                <span className="h-4 w-28 animate-pulse rounded bg-muted" />
              </>
            ) : session?.user ? (
              <>
                <Link href={dashboard} className="hover:text-foreground">Dashboard</Link>
                <Link
                  href={`${dashboard}#profile`}
                  onClick={() => emitDashboardHash("profile")}
                  className="hover:text-foreground"
                >
                  My profile
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-foreground">Sign in</Link>
                <Link href="/register" className="hover:text-foreground">Create account</Link>
              </>
            )}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">PizzaHub</h3>
          <p className="text-sm text-muted-foreground">
            Built for pizza lovers and independent kitchens.
          </p>
        </div>
      </div>
      <div className="border-t border-border/70 px-4 py-5 text-center text-xs text-muted-foreground">
        © <CurrentYear /> PizzaHub. All rights reserved.
      </div>
    </footer>
  );
}
