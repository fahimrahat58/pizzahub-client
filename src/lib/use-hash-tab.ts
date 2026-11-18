"use client";

import { useCallback, useEffect, useState } from "react";

import { DASHBOARD_HASH_EVENT, emitDashboardHash } from "@/lib/dashboard-hash";

export function useHashTab<T extends string>(defaultTab: T, allowed: readonly T[]) {
  const [tab, setTab] = useState<T>(defaultTab);
  const key = allowed.join(",");

  useEffect(() => {
    const read = (value?: string) => {
      const hash = (value ?? window.location.hash).replace(/^#/, "");
      if ((allowed as readonly string[]).includes(hash)) setTab(hash as T);
    };
    const readLocation = () => read();
    const readEvent = (event: Event) =>
      read((event as CustomEvent<string>).detail);

    readLocation();
    window.addEventListener("hashchange", readLocation);
    window.addEventListener("popstate", readLocation);
    window.addEventListener(DASHBOARD_HASH_EVENT, readEvent);
    return () => {
      window.removeEventListener("hashchange", readLocation);
      window.removeEventListener("popstate", readLocation);
      window.removeEventListener(DASHBOARD_HASH_EVENT, readEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const changeTab = useCallback((next: T) => {
    setTab(next);
    const url = `${window.location.pathname}${window.location.search}#${next}`;
    window.history.replaceState(null, "", url);
    emitDashboardHash(next);
  }, []);

  return [tab, changeTab] as const;
}
