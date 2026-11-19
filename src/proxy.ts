import { NextResponse, type NextRequest } from "next/server";

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

  if (!hasSessionCookie) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  // `/menu` stays public; `/menu/:id` (item details) requires a session.
  // `/taste-dna` joins the existing protected set without replacing any matcher.
  matcher: ["/dashboard/:path*", "/account/:path*", "/menu/:id", "/taste-dna"],
};
