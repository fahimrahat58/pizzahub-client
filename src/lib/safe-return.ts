/**
 * Shared validation for post-login return paths.
 *
 * Only same-origin absolute paths are accepted. Auth/error pages are excluded
 * so a crafted `next` value cannot bounce a signed-in user back into login or
 * into an external host.
 */
export const SAFE_RETURN_HEADER = "x-auth-return-to";

const BLOCKED_PATHS = ["/login", "/register", "/blocked", "/unauthorized", "/auth/callback"];

export const safeReturnPath = (value: string | null | undefined): string | null => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;

  const pathname = value.split(/[?#]/, 1)[0] ?? "";
  if (
    BLOCKED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    return null;
  }

  return value;
};

export const loginWithReturn = (value: string | null | undefined): string => {
  const safe = safeReturnPath(value);
  if (!safe) return "/login";
  const params = new URLSearchParams();
  params.set("next", safe);
  return `/login?${params.toString()}`;
};
