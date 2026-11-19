"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Brand } from "@/components/shared/ui-kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { clearApiToken } from "@/lib/api";
import { emitDashboardHash } from "@/lib/dashboard-hash";
import { dashboardForRole, normalizeRole } from "@/lib/roles";
import type { UserRole } from "@/lib/types";
import { useVendorOrderCount } from "@/lib/vendor-order-notifications";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Browse Menu" },
  { href: "/restaurants", label: "Restaurants" },
];

const navLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground";
const mobileNavLinkClass =
  "rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted";
const activeNavLinkClass = "bg-muted text-foreground";

// Only these four public links take part in pathname-based highlighting.
const activeLinkHrefs = new Set(["/", "/menu", "/restaurants", "/taste-dna"]);

function isActiveLink(href: string, pathname: string) {
  if (!activeLinkHrefs.has(href)) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type HeaderLink = { href: string; label: string; badgeCount?: number };

type NavLinkItemsProps = {
  links: HeaderLink[];
  pathname?: string;
  baseClassName: string;
  onNavigate: (href: string) => void;
};

function NavLinkItems({
  links,
  pathname,
  baseClassName,
  onNavigate,
}: NavLinkItemsProps) {
  return (
    <>
      {links.map((link) => {
        const active = pathname ? isActiveLink(link.href, pathname) : false;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(baseClassName, active && activeNavLinkClass)}
            onClick={() => onNavigate(link.href)}
          >
            {link.label}
            {link.badgeCount && link.badgeCount > 0 ? (
              <Badge
                className="ml-1.5 bg-orange-500 text-white"
                aria-label={`${link.badgeCount} unseen orders`}
              >
                {link.badgeCount}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}

// Kept separate so usePathname only suspends this small list, not the whole header.
function ActiveNavLinkItems({
  links,
  baseClassName,
  onNavigate,
}: Omit<NavLinkItemsProps, "pathname">) {
  const pathname = usePathname();
  return (
    <NavLinkItems
      links={links}
      pathname={pathname}
      baseClassName={baseClassName}
      onNavigate={onNavigate}
    />
  );
}

const roleLinks: Record<UserRole, { href: string; label: string }[]> = {
  customer: [{ href: "/dashboard/customer#orders", label: "My Orders" }],
  vendor: [
    { href: "/dashboard/vendor/menu", label: "My Menu" },
    { href: "/dashboard/vendor/orders", label: "Orders" },
  ],
  admin: [
    { href: "/dashboard/admin#users", label: "Manage Users" },
    { href: "/dashboard/admin#menu", label: "Menu Items" },
    { href: "/dashboard/transactions", label: "Transactions" },
  ],
};

// Customer-only, shared by the desktop and mobile navigation.
const tasteDnaLink = { href: "/taste-dna", label: "Taste DNA" };

export function SiteHeader() {
  const router = useRouter();
  const signingOutRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const role = session?.user ? normalizeRole(session.user.role) : undefined;
  const dashboard = dashboardForRole(role);
  // Same shared store as the dashboard sidebar; this hook does not add a poller.
  const vendorUnseenOrders = useVendorOrderCount(role === "vendor");

  // Navbar visibility is only a hint, not authorization: the page guard and
  // the Express API both re-check the live session and role. Waiting for
  // session revalidation prevents a cached/pending session from briefly
  // flashing this link to a guest or to a non-customer.
  const showTasteDnaLink =
    !sessionPending &&
    session?.user?.role === "customer" &&
    session.user.isBlocked !== true;

  const allLinks: HeaderLink[] = [
    ...publicLinks,
    ...(role ? roleLinks[role] : []),
    ...(showTasteDnaLink ? [tasteDnaLink] : []),
  ].map((link) =>
    role === "vendor" && link.href === "/dashboard/vendor/orders"
      ? { ...link, badgeCount: vendorUnseenOrders }
      : link,
  );

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
      toast.success("Signed out successfully!", { id: "sign-out-success" });
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Unable to sign out. Please try again.", { id: "sign-out-error" });
      signingOutRef.current = false;
      setSigningOut(false);
    }
  };

  const followLink = (href: string) => {
    setOpen(false);
    const hash = href.includes("#") ? href.split("#")[1] : null;
    if (hash) emitDashboardHash(hash);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Brand className="text-xl sm:text-2xl" />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          <Suspense
            fallback={
              <NavLinkItems
                links={allLinks}
                baseClassName={navLinkClass}
                onNavigate={followLink}
              />
            }
          >
            <ActiveNavLinkItems
              links={allLinks}
              baseClassName={navLinkClass}
              onNavigate={followLink}
            />
          </Suspense>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Open profile menu"
                className="flex items-center gap-2 rounded-full border border-border/70 bg-background py-1 pr-2 pl-1 text-sm font-medium transition hover:border-orange-500/50 hover:bg-muted"
              >
                {session.user.image ? (
                  // Better Auth profile images are external URLs.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-8 items-center justify-center rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400">
                    <UserRound className="size-4" />
                  </span>
                )}
                <span className="max-w-32 truncate">{session.user.name}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {session.user.name}
                    </span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {session.user.email}
                    </span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(dashboard)}>
                  <LayoutDashboard /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    emitDashboardHash("profile");
                    router.push(`${dashboard}#profile`);
                  }}
                >
                  <Settings /> Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={signingOut}
                  aria-busy={signingOut}
                  onClick={() => void handleSignOut()}
                >
                  {signingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
                  {signingOut ? "Signing out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Sign In
              </Link>
              <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
                Sign Up
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            <Suspense
              fallback={
                <NavLinkItems
                  links={allLinks}
                  baseClassName={mobileNavLinkClass}
                  onNavigate={followLink}
                />
              }
            >
              <ActiveNavLinkItems
                links={allLinks}
                baseClassName={mobileNavLinkClass}
                onNavigate={followLink}
              />
            </Suspense>
            {session?.user ? (
              <>
                <div className="mt-2 flex items-center gap-2 rounded-md border border-border/70 px-3 py-2.5">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      className="size-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-9 items-center justify-center rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400">
                      <UserRound className="size-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{session.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                </div>
                <Link
                  href={dashboard}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <LayoutDashboard className="size-4" /> Dashboard
                </Link>
                <Link
                  href={`${dashboard}#profile`}
                  onClick={() => followLink(`${dashboard}#profile`)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <Settings className="size-4" /> Profile Settings
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={signingOut}
                  aria-busy={signingOut}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  {signingOut ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogOut className="size-4" aria-hidden="true" />
                  )}
                  {signingOut ? "Signing out..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <UserRound className="size-4" /> Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants({ size: "sm" }), "mt-2")}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
