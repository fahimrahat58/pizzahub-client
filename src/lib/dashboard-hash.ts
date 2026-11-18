export const DASHBOARD_HASH_EVENT = "pizzahub:dashboard-hash";

/** Keeps sidebar links and in-page tabs in sync on same-route hash navigation. */
export const emitDashboardHash = (hash: string): void => {
  window.dispatchEvent(
    new CustomEvent<string>(DASHBOARD_HASH_EVENT, { detail: hash.replace(/^#/, "") }),
  );
};
