"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  ClipboardList,
  CreditCard,
  Heart,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  PieChart,
  Pizza,
  Receipt,
  Settings,
  Star,
  Store,
  Sparkles,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardChromeStyles } from "@/components/dashboard/dashboard-chrome-styles";
import { Brand } from "@/components/shared/ui-kit";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { clearApiToken } from "@/lib/api";
import { DASHBOARD_HASH_EVENT, emitDashboardHash } from "@/lib/dashboard-hash";
import { normalizeRole } from "@/lib/roles";
import type { UserRole } from "@/lib/types";
import { useVendorOrderCount } from "@/lib/vendor-order-notifications";
import { cn } from "@/lib/utils";

type NavItem = {
  hash?: string;
  href?: string;
  label: string;
  icon: LucideIcon;
};

const navByRole: Record<UserRole, NavItem[]> = {
  customer: [
    { hash: "overview", label: "Overview", icon: LayoutDashboard },
    { hash: "orders", label: "My orders", icon: ClipboardList },
    { hash: "favorites", label: "Favorites", icon: Heart },
    { hash: "taste-dna", label: "Taste DNA", icon: Sparkles },
    { hash: "profile", label: "Profile", icon: Settings },
  ],
  vendor: [
    { href: "/dashboard/vendor", label: "Overview", icon: LayoutDashboard },
    {
      href: "/dashboard/vendor/restaurant",
      label: "My Restaurant",
      icon: Store,
    },
    { href: "/dashboard/vendor/menu", label: "My Menu", icon: Pizza },
    { href: "/dashboard/vendor/orders", label: "Orders", icon: ClipboardList },
    { href: "/dashboard/vendor/reviews", label: "Reviews", icon: Star },
    { href: "/dashboard/vendor/profile", label: "Profile", icon: Settings },
    {
      href: "/dashboard/vendor/subscription",
      label: "Subscription",
      icon: Sparkles,
    },
  ],
  admin: [
    { hash: "overview", label: "Overview", icon: PieChart },
    { hash: "menu", label: "Menu moderation", icon: BadgeCheck },
    { hash: "users", label: "Users", icon: UsersRound },
    { hash: "billing", label: "Billing", icon: CreditCard },
    { hash: "transactions", label: "Transactions", icon: Receipt },
    { hash: "orders", label: "Orders", icon: ClipboardList },
    { hash: "reviews", label: "Reviews", icon: Star },
    { hash: "profile", label: "Profile", icon: Settings },
  ],
};

function SidebarContent({
  role,
  name,
  pathname,
  currentHash,
  hashBasePath,
  unseenOrders,
  signingOut,
  onNavigate,
  onSignOut,
}: {
  role: UserRole;
  name: string;
  pathname: string;
  currentHash: string;
  hashBasePath: string;
  unseenOrders: number;
  signingOut: boolean;
  onNavigate: (hash?: string) => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
        <Brand className="text-xl" />
      </div>

      <nav
        className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-4"
        aria-label="Dashboard navigation"
      >
        {navByRole[role].map(({ hash, href: itemHref, label, icon: Icon }) => {
          const href = hash
            ? `${hashBasePath}#${hash}`
            : (itemHref ?? hashBasePath);
          const isVendorSection =
            itemHref?.startsWith("/dashboard/vendor/") ?? false;
          const isAdminOrderDetail =
            role === "admin" &&
            hash === "orders" &&
            pathname.startsWith(`${hashBasePath}/orders/`);
          const active = hash
            ? (pathname === hashBasePath && currentHash === `#${hash}`) ||
              isAdminOrderDetail
            : pathname === itemHref ||
              (isVendorSection && pathname.startsWith(`${itemHref}/`));
          const showOrderBadge =
            role === "vendor" &&
            itemHref === "/dashboard/vendor/orders" &&
            unseenOrders > 0;

          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate(hash)}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {showOrderBadge ? (
                <Badge
                  className="ml-auto bg-primary text-primary-foreground"
                  aria-label={`${unseenOrders} unseen orders`}
                >
                  {unseenOrders}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name}</p>
            <Badge variant="outline" className="mt-0.5 capitalize text-[10px]">
              {role}
            </Badge>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Appearance</span>
          <ThemeToggle size="sm" />
        </div>
        <Button
          variant="ghost"
          className="flex w-full shrink-0 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive"
          disabled={signingOut}
          aria-busy={signingOut}
          onClick={onSignOut}
        >
          {signingOut ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="size-4" aria-hidden="true" />
          )}
          {signingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>
    </div>
  );
}

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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerWasOpen = useRef(false);
  const signingOutRef = useRef(false);
  const [signingOut, setSigningOut] = useState(false);
  // The hash is read after hydration so server and client render the same
  // initial markup. This also keeps the active item correct after sidebar
  // navigation without relying on a render-time `window` check.
  const [currentHash, setCurrentHash] = useState("#overview");
  // A legacy or empty session role falls back to the customer navigation.
  const safeRole = normalizeRole(role);
  const safeName = userName?.trim() || "Account";
  const hashBasePath =
    safeRole === "admin" ? "/dashboard/admin" : "/dashboard/customer";
  // Shared with the main navbar through one store and one poller.
  const unseenOrders = useVendorOrderCount(safeRole === "vendor");

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
  }, [pathname]);

  useEffect(() => {
    // Base UI traps focus inside the drawer, but the trigger is a plain button
    // rather than a SheetTrigger, so restore focus here when the drawer closes.
    if (drawerWasOpen.current && !open) menuButtonRef.current?.focus();
    drawerWasOpen.current = open;
  }, [open]);

  const handleSignOut = async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    setSigningOut(true);

    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message ?? "Sign out failed");
      // Sync the session atom before navigating so /login cannot briefly reuse
      // a stale authenticated session and redirect away.
      await authClient.getSession();
      clearApiToken();
      toast.success("Logout successful", { id: "sign-out-success" });
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Unable to sign out. Please try again.", {
        id: "sign-out-error",
      });
    } finally {
      signingOutRef.current = false;
      setSigningOut(false);
    }
  };

  const handleNavigate = (hash?: string) => {
    setOpen(false);
    if (hash) emitDashboardHash(hash);
  };

  return (
    <div
      data-dashboard-shell
      className="flex min-h-dvh w-full overflow-x-clip bg-muted/20"
    >
      <DashboardChromeStyles />

      <aside
        id="dashboard-sidebar"
        className="fixed inset-y-0 left-0 z-50 hidden h-dvh w-64 shrink-0 overflow-hidden border-r border-sidebar-border lg:flex"
      >
        <SidebarContent
          role={safeRole}
          name={safeName}
          pathname={pathname}
          currentHash={currentHash}
          hashBasePath={hashBasePath}
          unseenOrders={unseenOrders}
          signingOut={signingOut}
          onNavigate={handleNavigate}
          onSignOut={() => void handleSignOut()}
        />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[17rem] max-w-[85vw] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:max-w-none"
        >
          <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Choose a section of your {safeRole} dashboard.
          </SheetDescription>
          <SheetClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-4 right-4 z-10"
                aria-label="Close navigation"
              />
            }
          >
            <X className="size-4" aria-hidden="true" />
          </SheetClose>
          <SidebarContent
            role={safeRole}
            name={safeName}
            pathname={pathname}
            currentHash={currentHash}
            hashBasePath={hashBasePath}
            unseenOrders={unseenOrders}
            signingOut={signingOut}
            onNavigate={handleNavigate}
            onSignOut={() => void handleSignOut()}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 max-w-none flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6">
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="dashboard-sidebar"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {safeName}&apos;s workspace
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {safeRole} dashboard
            </p>
          </div>
          <div className="ml-auto shrink-0">
            <Link
              href="/"
              className="rounded text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View site
            </Link>
          </div>
        </header>
        <main className="min-w-0 max-w-none flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
