'use server';

import { cookies } from 'next/headers';
import { getRequest } from '@/services/api';
import type { SessionUser } from '@/src/types';

/**
 * Reads the current session from the backend.
 *
 * `permissions` comes from AccessService.resolve() rather than from the JWT, so
 * a role created after the token was issued still takes effect on the next
 * request. It arrives in a response body, not a signed claim — which is exactly
 * why it may drive what the UI SHOWS and never what the server ALLOWS.
 */
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) return null;

  const res = await getRequest<undefined, SessionUser>('/auth/me');
  if (!res.success || !res.data) return null;
  return res.data;
}
