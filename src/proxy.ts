import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast, coarse redirect for protected pages. Role and blocked checks are
 * repeated on the server in `requireUser` and again by the Express API.
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
  matcher: ["/dashboard/:path*", "/account/:path*", "/menu/:id"],
};
