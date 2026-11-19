"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PizzaMascot } from "@/components/dashboard/taste-dna-illustrations";
import { TasteDnaPanel } from "@/components/dashboard/taste-dna-panel";
import { buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/**
 * Client-side follow-up to the server's AuthGate. It reacts to sign-out or a
 * role change while the page is open so the panel unmounts and no further
 * personalized requests are made. It is not the primary authorization layer:
 * requireUser and the Express API both re-verify the live session and role.
 */
export function TasteDnaView() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user;
  const authorized =
    !isPending && user?.role === "customer" && user.isBlocked !== true;

  useEffect(() => {
    if (isPending || authorized) return;
    if (!user) router.replace("/login");
    else if (user.isBlocked === true) router.replace("/blocked");
    else router.replace("/unauthorized");
  }, [authorized, isPending, router, user]);

  if (!authorized) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <PizzaMascot mood="happy" size={56} />
          <p className="text-sm text-muted-foreground">Checking your session…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Just for you
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">Your Taste DNA</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A personalized menu built only from your own orders, favorites and
            reviews. Pick a pizza to see details and order it.
          </p>
        </div>
        <Link
          href="/dashboard/customer#taste-dna"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
      </div>

      <TasteDnaPanel />
    </main>
  );
}
