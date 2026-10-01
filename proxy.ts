import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/verify-otp"];

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

  const token = request.cookies.get("admin_token");
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!token && !isPublic) {
    const url = new URL("/login", request.url);
    // Remember where they were headed so login can return them there.
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (token && isPublic) {
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
