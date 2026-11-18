"use client";

import Link from "next/link";
import { AtSign, Camera, Globe, Mail, MapPin, Phone, Play } from "lucide-react";

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
            Handcrafted pizzas, local kitchens, and an ordering experience worth
            coming back to.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Explore</h3>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/menu" className="hover:text-foreground">Browse Menu</Link>
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
                <Link href="/login" className="hover:text-foreground">Sign In</Link>
                <Link href="/register" className="hover:text-foreground">Sign Up</Link>
              </>
            )}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Contact</h3>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <a href="mailto:hello@pizzahub.example" className="flex items-center gap-2 hover:text-foreground">
              <Mail className="size-4 shrink-0" /> hello@pizzahub.example
            </a>
            <a href="tel:+15550123456" className="flex items-center gap-2 hover:text-foreground">
              <Phone className="size-4 shrink-0" /> +1 (555) 012-3456
            </a>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" /> 24 Pizza Lane, Food District
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="PizzaHub on Facebook"
                className="rounded-md border border-border/70 p-2 transition hover:border-orange-500/60 hover:text-orange-500"
              >
                <Globe className="size-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="PizzaHub on Instagram"
                className="rounded-md border border-border/70 p-2 transition hover:border-orange-500/60 hover:text-orange-500"
              >
                <Camera className="size-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="PizzaHub on X"
                className="rounded-md border border-border/70 p-2 transition hover:border-orange-500/60 hover:text-orange-500"
              >
                <AtSign className="size-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="PizzaHub on YouTube"
                className="rounded-md border border-border/70 p-2 transition hover:border-orange-500/60 hover:text-orange-500"
              >
                <Play className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border/70 px-4 py-5 text-center text-xs text-muted-foreground">
        © <CurrentYear /> PizzaHub. All rights reserved.
      </div>
    </footer>
  );
}
