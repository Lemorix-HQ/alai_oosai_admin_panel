'use server';

import { cookies } from 'next/headers';
import { deleteRequest, getRequest, postRequest } from '@/services/api';
import { SITTING_COOKIE } from '@/src/session/cookie';
import type {
  AccessCodeStatus, HouseholdSnapshot, IssuedAccessCode, OpenedSitting,
  RevokedAccessCode, SelfServiceParish, SubmitSittingPayload, SubmittedSitting,
} from '@/src/types';

// ------------------------------------------------------------- access codes

/**
 * Issues a code, or replaces the one already out.
 *
 * **The only call in the panel whose response carries the plaintext code.** The
 * server keeps a bcrypt hash and nothing else, so the value in this response is
 * the single chance to write it down — which is why the caller shows it in a
 * reveal-once panel rather than storing it anywhere.
 */
export async function issueAccessCodeAction(familyId: string) {
  return postRequest<undefined, IssuedAccessCode>(`/families/${familyId}/access-code`);
}

/** Whether a code is out, and until when. Never the code. */
export async function getAccessCodeStatusAction(familyId: string) {
  return getRequest<undefined, AccessCodeStatus>(`/families/${familyId}/access-code`);
}

export async function revokeAccessCodeAction(familyId: string) {
  return deleteRequest<RevokedAccessCode>(`/families/${familyId}/access-code`);
}

// ------------------------------------------------ the household's own form

/**
 * The sitting token lives here and nowhere else.
 *
 * httpOnly, so client JavaScript on a public page cannot read it, and scoped to
 * the form's own path so it is not sent with every other request the browser
 * makes. Its lifetime follows the API's, which is why the API returns the
 * minutes rather than the page guessing.
 */
async function setSittingCookie(token: string, minutes: number) {
  const cookieStore = await cookies();
  cookieStore.set(SITTING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.max(60, minutes * 60),
    path: '/family-update',
  });
}

/** Public: the parish picker, before anyone has proved anything. */
export async function listSelfServiceParishesAction() {
  return getRequest<undefined, SelfServiceParish[]>(
    '/self-service/parishes', undefined, undefined, 'none',
  );
}

/**
 * Parish + family code + access code, in one submit.
 *
 * On success the sitting token goes straight into the cookie and is **stripped
 * from what the page receives** — the browser never needs it, and returning it
 * would put a credential into client JavaScript and into the React payload.
 */
export async function openSittingAction(input: {
  parish_id: string;
  family_code: string;
  access_code: string;
}) {
  const res = await postRequest<typeof input, OpenedSitting & { token?: string }>(
    '/self-service/open', input, 'none',
  );

  if (!res.success || !res.data?.token) return res;

  await setSittingCookie(res.data.token, res.data.expires_in_minutes);

  const data: OpenedSitting & { token?: string } = { ...res.data };
  delete data.token;
  return { ...res, data: data as OpenedSitting };
}

/** The household again, for a form that has been left open. */
export async function getHouseholdAction() {
  return getRequest<undefined, HouseholdSnapshot>(
    '/self-service/household', undefined, undefined, 'sitting',
  );
}

export async function submitSittingAction(payload: SubmitSittingPayload) {
  return postRequest<SubmitSittingPayload, SubmittedSitting>(
    '/self-service/submit', payload, 'sitting',
  );
}

/** Ends the sitting on this machine. A parish computer is a shared one. */
export async function closeSittingAction() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: SITTING_COOKIE, path: '/family-update' });
}
