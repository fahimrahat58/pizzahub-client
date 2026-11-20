"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only after hydration.
 *
 * Cart consumers read a client-side context provider. When an async Server
 * Component such as AuthGate suspends inside that provider, Next.js can stream
 * the resolved subtree outside the provider during SSR. Deferring these
 * consumers keeps the single server-backed cart context intact on the client.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : <>{fallback}</>;
}
