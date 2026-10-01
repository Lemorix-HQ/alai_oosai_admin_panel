import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/src/session/cookie";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/accept-invite", "/reset-password"];

/**
 * Public paths that must render even when the browser already holds a session.
 *
 * A link token addresses a specific ACCOUNT, not whoever is signed in on this
 * machine. Bouncing the holder to the dashboard — as somebody else, on a shared
 * parish computer — is how an invitation silently never gets accepted.
 */
const TOKEN_PATHS = ["/accept-invite", "/reset-password"];

/**
 * Edge-level authentication. Next 16 calls this `proxy`; it is the former
 * `middleware`.
 *
 * This answers only "is there a session". What a user may DO is decided by the
 * backend PermissionsGuard, which the panel mirrors for presentation through
 * useSession().can(). Permission checks do not belong here: the cookie carries
 * a token, not a permission set, and re-deriving one at the edge would put a
 * second, drifting copy of the rules in front of the real one.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /logout clears a rejected cookie. It must run whether or not a cookie
  // is present, otherwise the rule below sends it back to / and the loop
  // it exists to break never breaks.
  if (pathname === "/logout") return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE);
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!token && !isPublic) {
    const url = new URL("/login", request.url);
    // Remember where they were headed so login can return them there.
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const carriesToken = TOKEN_PATHS.some((path) => pathname.startsWith(path));
  if (token && isPublic && !carriesToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
