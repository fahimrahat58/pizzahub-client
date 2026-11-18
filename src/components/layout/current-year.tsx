"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getServerSnapshot = () => 2026;
const getClientSnapshot = () => new Date().getFullYear();

/** Avoids calling new Date() during prerendering while keeping the year current in the browser. */
export function CurrentYear() {
  return <>{useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)}</>;
}
