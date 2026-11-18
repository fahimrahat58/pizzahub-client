"use client";

import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";

/**
 * Keeps Better Auth's shared session store fresh after a full page load and
 * when the user returns to the tab. `useSession` alone only refreshed after a
 * focus event in this app, which left the navbar briefly signed out.
 */
export function SessionSync() {
  useEffect(() => {
    const refresh = () => {
      void authClient.getSession();
    };
    const onVisibilityChange = () => {
      if (!document.hidden) refresh();
    };

    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
