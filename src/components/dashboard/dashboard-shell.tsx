"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  ClipboardList,
  CreditCard,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  Pizza,
  Settings,
  Store,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { clearApiToken } from "@/lib/api";
import {
  DASHBOARD_HASH_EVENT,
  emitDashboardHash,
} from "@/lib/dashboard-hash";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/shared/ui-kit";

type NavItem = {
  hash?: string;
  href?: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const navByRole: Record<UserRole, NavItem[]> = {
  customer: [
    { hash: "overview", label: "Overview", icon: LayoutDashboard },
    { hash: "orders", label: "My orders", icon: ClipboardList },
    { hash: "favorites", label: "Favorites", icon: Heart },
    { hash: "profile", label: "Profile", icon: Settings },
  ],
  vendor: [
    { href: "/dashboard/vendor", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/vendor/restaurant", label: "My Restaurant", icon: Store },
    { href: "/dashboard/vendor/menu", label: "My Menu", icon: Pizza },
    { href: "/dashboard/vendor/orders", label: "Orders", icon: ClipboardList },
    { href: "/dashboard/vendor/profile", label: "Profile", icon: Settings },
    { href: "/dashboard/vendor/subscription", label: "Subscription", icon: Sparkles },
  ],
  admin: [
    { hash: "overview", label: "Overview", icon: PieChart },
    { hash: "menu", label: "Menu moderation", icon: BadgeCheck },
    { hash: "users", label: "Users", icon: UsersRound },
    { hash: "billing", label: "Billing", icon: CreditCard },
    { hash: "orders", label: "Orders", icon: ClipboardList },
    { hash: "profile", label: "Profile", icon: Settings },
  ],
};

export function DashboardShell({
  role,
  userName,
  children,
}: {
  role: UserRole;
  userName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  // The hash is read after hydration so server and client render the same
  // initial markup. This also keeps the active item correct after sidebar
  // navigation without relying on a render-time `window` check.
  const [currentHash, setCurrentHash] = useState("#overview");
  const items = navByRole[role];

  useEffect(() => {
    const sync = () => setCurrentHash(window.location.hash || "#overview");
    const syncEvent = (event: Event) =>
      setCurrentHash(`#${(event as CustomEvent<string>).detail}`);
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    window.addEventListener(DASHBOARD_HASH_EVENT, syncEvent);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
      window.removeEventListener(DASHBOARD_HASH_EVENT, syncEvent);
    };
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      clearApiToken();
      await authClient.signOut();
      toast.success("Signed out");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
      setSigningOut(false);
    }
  };

  return (
    <div className="flex min-h-dvh bg-muted/20">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-64 flex-col overflow-hidden border-r border-border bg-background transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <Brand className="text-xl" />
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav
          className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-4"
          aria-label="Dashboard navigation"
        >
          {items.map(({ hash, href: itemHref, label, icon: Icon }) => {
            const href = hash ? `${pathname}#${hash}` : (itemHref ?? pathname);
            const active = hash
              ? currentHash === `#${hash}`
              : itemHref === "/dashboard/vendor"
                ? pathname === itemHref
                : pathname === itemHref ||
                  (itemHref ? pathname.startsWith(`${itemHref}/`) : false);
            return (
              <Link
                key={label}
                href={href}
                onClick={() => {
                  setOpen(false);
                  if (hash) emitDashboardHash(hash);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  active && "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-3 border-t border-border px-4 py-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-sm font-bold text-orange-600 dark:text-orange-400">
              {userName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              <Badge variant="outline" className="mt-0.5 capitalize text-[10px]">{role}</Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            className="flex w-full shrink-0 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{userName}&apos;s workspace</p>
            <p className="text-xs text-muted-foreground capitalize">{role} dashboard</p>
          </div>
          <div className="ml-auto">
            <Link
              href="/"
              className="text-sm font-medium text-orange-500 hover:underline"
            >
              View site
            </Link>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
