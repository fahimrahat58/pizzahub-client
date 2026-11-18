"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
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
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { clearApiToken } from "@/lib/api";
import { emitDashboardHash } from "@/lib/dashboard-hash";
import { dashboardForRole } from "@/lib/roles";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Browse Menu" },
  { href: "/restaurants", label: "Restaurants" },
];

// Active-link styling used to depend on usePathname(). That URL hook requires a
// Suspense boundary on dynamic routes under Cache Components; the public shell
// is hidden on dashboards with CSS instead, so the header has no runtime URL read.
const navLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground";

const roleLinks: Record<UserRole, { href: string; label: string }[]> = {
  customer: [{ href: "/dashboard/customer#orders", label: "My Orders" }],
  vendor: [
    { href: "/dashboard/vendor/menu", label: "My Menu" },
    { href: "/dashboard/vendor/orders", label: "Orders" },
  ],
  admin: [
    { href: "/dashboard/admin#users", label: "Manage Users" },
    { href: "/dashboard/admin#menu", label: "Menu Items" },
    { href: "/dashboard/admin#transactions", label: "Transactions" },
  ],
};

export function SiteHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { data: session } = authClient.useSession();
  const role = session?.user?.role as UserRole | undefined;
  const dashboard = dashboardForRole(role);

  const allLinks = [
    ...publicLinks,
    ...(role ? roleLinks[role] : []),
  ];

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      clearApiToken();
      await authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } });
      toast.success("Signed out");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
    } finally {
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
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClass}
              onClick={() => followLink(link.href)}
            >
              {link.label}
            </Link>
          ))}
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
                  onClick={() => void handleSignOut()}
                >
                  <LogOut /> Logout
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
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => followLink(link.href)}
                className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
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
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-4" /> Logout
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
