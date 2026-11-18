"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { clearApiToken } from "@/lib/api";
import { dashboardForRole } from "@/lib/roles";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/shared/ui-kit";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/restaurants", label: "Restaurants" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const role = session?.user?.role as UserRole | undefined;

  if (pathname.startsWith("/dashboard")) return null;

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

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Brand className="text-xl sm:text-2xl" />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                pathname === link.href && "bg-muted text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isPending ? (
            <div className="size-8 animate-pulse rounded-full bg-muted" />
          ) : session?.user ? (
            <>
              <Badge variant="outline" className="capitalize">
                {role}
              </Badge>
              <Link
                href={dashboardForRole(role)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <LayoutDashboard className="size-4" /> Dashboard
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Sign out"
                disabled={signingOut}
                onClick={() => void handleSignOut()}
              >
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Sign in
              </Link>
              <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
                Get started
              </Link>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted",
                  pathname === link.href && "bg-muted",
                )}
              >
                {link.label}
              </Link>
            ))}
            {session?.user ? (
              <>
                <Link
                  href={dashboardForRole(role)}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <LayoutDashboard className="size-4" /> Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={signingOut}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <UserRound className="size-4" /> Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants({ size: "sm" }), "mt-2")}
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
