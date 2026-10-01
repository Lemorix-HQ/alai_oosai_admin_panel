/**
 * The name of the session cookie.
 *
 * Browsers match cookies by host and ignore the port, so the dev panel on
 * localhost:3001 and the test panel on localhost:3401 are the same origin as
 * far as cookies are concerned. They do not share a JWT secret, so a token set
 * by one is rejected by the other's API — and proxy.ts, which only checks that
 * a cookie exists, would bounce between / and /login forever.
 *
 * AUTH_COOKIE_NAME is set per environment to keep the two apart. It is read at
 * runtime, not baked in at build time, for the same reason API_URL is: one
 * image runs as both stacks.
 */
export const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || 'admin_token';
