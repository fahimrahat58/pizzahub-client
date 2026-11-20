import { NextResponse, type NextRequest } from "next/server";

import { loginWithReturn, SAFE_RETURN_HEADER, safeReturnPath } from "./lib/safe-return";

/**
 * Fast, coarse redirect for protected pages. Only session-cookie presence is
 * checked here: the Better Auth JWT carries a session id (not a role), so this
 * layer cannot make a trustworthy role or blocked decision. Definitive checks
 * are repeated on the server in `requireUser` (AuthGate on /taste-dna) and
 * again by the Express API's verifyToken + requireRole("customer").
 */
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("session_token"));
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const safeReturn = safeReturnPath(returnTo);

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL(loginWithReturn(safeReturn), request.url));
  }

  // A cookie can be present but stale/invalid. Pass the validated original URL
  // upstream so requireUser() can preserve it through the real auth check.
  const requestHeaders = new Headers(request.headers);
  // Never trust an inbound value; the proxy derives it from this request only.
  requestHeaders.delete(SAFE_RETURN_HEADER);
  if (safeReturn) requestHeaders.set(SAFE_RETURN_HEADER, safeReturn);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // `/menu` stays public; `/menu/:id` (item details) requires a session.
  // Cart, checkout, and Stripe result pages need the same coarse cookie check;
  // AuthGate and the Express API still perform the definitive role checks.
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/menu/:id",
    "/taste-dna",
    "/cart",
    "/checkout",
    "/payment/:path*",
  ],
};
