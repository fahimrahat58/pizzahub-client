"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { clearApiToken } from "@/lib/api";
import { postAuthDestination } from "@/lib/roles";
import { loginWithReturn, safeReturnPath } from "@/lib/safe-return";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { data: session, isPending, error } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    const nextPath = safeReturnPath(new URLSearchParams(window.location.search).get("next"));
    if (!session?.user) {
      toast.error("We couldn't complete sign-in. Please try again.");
      router.replace(loginWithReturn(nextPath));
      return;
    }
    if (session.user.isBlocked === true) {
      router.replace("/blocked");
      return;
    }
    clearApiToken();
    router.replace(nextPath ?? postAuthDestination(session.user.role));
    router.refresh();
  }, [isPending, router, session, error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <Loader2 className="size-8 animate-spin text-orange-500" />
      <h1 className="text-2xl font-semibold">Signing you in...</h1>
      <p className="text-sm text-muted-foreground">Just a moment while we prepare your dashboard.</p>
    </main>
  );
}
