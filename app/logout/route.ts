import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/src/session/cookie';

/**
 * Clears the session cookie and sends the user to the login page.
 *
 * The dashboard layout redirects here when /auth/me rejects the token. It
 * cannot delete the cookie itself — a Server Component may read cookies but
 * not write them — and redirecting straight to /login would loop, because
 * proxy.ts sees a cookie and sends a "logged in" user back to /.
 *
 * Reached when the backend's JWT secret changed, the account was removed, or
 * the cookie was set by a different stack on the same host.
 *
 * The Location is relative on purpose. Building an absolute one from
 * request.url yields the container's own address (http://<container id>:3000),
 * which the browser cannot reach through the published port.
 */
export function GET() {
  const response = new NextResponse(null, {
    status: 307,
    headers: { Location: '/login' },
  });
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
