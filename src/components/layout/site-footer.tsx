"use client";

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { CurrentYear } from "@/components/layout/current-year";
import { Brand } from "@/components/shared/ui-kit";
import { authClient } from "@/lib/auth-client";
import { emitDashboardHash } from "@/lib/dashboard-hash";
import { dashboardForRole } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.28-.04-1.25-.12-2.38-.12-2.36 0-3.98 1.44-3.98 4.08V9.9H7.5V13h2.84v8h3.16z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="size-4">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
      <path d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3-5.2 3z" />
    </svg>
  );
}

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
                <FacebookIcon />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="PizzaHub on Instagram"
                className="rounded-md border border-border/70 p-2 transition hover:border-orange-500/60 hover:text-orange-500"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="PizzaHub on X"
                className="rounded-md border border-border/70 p-2 transition hover:border-orange-500/60 hover:text-orange-500"
              >
                <XIcon />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="PizzaHub on YouTube"
                className="rounded-md border border-border/70 p-2 transition hover:border-orange-500/60 hover:text-orange-500"
              >
                <YouTubeIcon />
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
