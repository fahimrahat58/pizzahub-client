import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { loginWithReturn, SAFE_RETURN_HEADER, safeReturnPath } from "@/lib/safe-return";
import type { UserRole } from "@/lib/types";

export const getServerSession = async () => {
  const requestHeaders = await headers();
  return auth.api.getSession({
    headers: requestHeaders as unknown as Headers,
  });
};

/** Server-side guard used by dashboards; the API repeats every authorization check. */
export const requireUser = async (roles?: UserRole[]) => {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders as unknown as Headers,
  });
  const returnTo = safeReturnPath(requestHeaders.get(SAFE_RETURN_HEADER));

  if (!session?.user) redirect(loginWithReturn(returnTo));
  if (session.user.isBlocked === true) redirect("/blocked");

  if (roles?.length) {
    const role = session.user.role as UserRole;
    if (!roles.includes(role)) redirect("/unauthorized");
  }

  return session;
};
