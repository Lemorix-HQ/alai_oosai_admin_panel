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

/**
 * The sitting cookie for the public self-service form.
 *
 * A **different** cookie from the one above, and deliberately so. It holds a
 * token signed with the API's `SELF_SERVICE_JWT_SECRET`, which no guarded route
 * accepts, and it must not be mistaken for a session: `proxy.ts` decides
 * whether a browser is signed in by the presence of AUTH_COOKIE alone, so a
 * household holding one of these is correctly still "not signed in".
 *
 * Suffixed the same way, so the dev and test panels do not share it either.
 */
export const SITTING_COOKIE = `self_service_${AUTH_COOKIE}`;
