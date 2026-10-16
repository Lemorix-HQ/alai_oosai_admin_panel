'use server';

import { cookies } from 'next/headers';
import { deleteRequest, getRequest, postRequest } from '@/services/api';
import { SITTING_COOKIE } from '@/src/session/cookie';
import type {
  AccessCodeRequest, AccessCodeStatus, HouseholdSnapshot, IssuedAccessCode, OpenedSitting,
  ParishStaffContacts, ResolvedParish, RevokedAccessCode, SelfServiceParish,
  SubmitSittingPayload, SubmittedSitting,
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

/** The Code Issue Management screen's list — what a household's own request leaves for staff. */
export async function listAccessCodeRequestsAction() {
  return getRequest<undefined, AccessCodeRequest[]>('/access-code-requests');
}

/** Clears a stale or mistaken request without issuing a code. */
export async function dismissAccessCodeRequestAction(id: string) {
  return deleteRequest<{ dismissed: boolean }>(`/access-code-requests/${id}`);
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
 * Public: the one parish named by `?parish=<code>` on `/family-update` —
 * what replaced the dropdown above. Never trusted as an id; the backend
 * re-resolves it from the code itself.
 */
export async function resolveParishAction(code: string) {
  return getRequest<{ code: string }, ResolvedParish>(
    '/self-service/parish', { code }, undefined, 'none',
  );
}

/**
 * Public: who to contact for a code — the priest, any assistant priests, and
 * the faculty who hold `family.access_code.manage` — shown next to the
 * "Request a code" button so a household has somewhere to actually take
 * that request.
 */
export async function getParishStaffContactsAction(code: string) {
  return getRequest<{ code: string }, ParishStaffContacts>(
    '/self-service/staff', { code }, undefined, 'none',
  );
}

/**
 * Public: a household with no code yet, asking for one. No sitting token —
 * nothing is proved here but the family code, which is already enumerable
 * and not treated as a secret elsewhere in this codebase.
 *
 * `phone` is where the parish can reach the household about this one
 * request — stored only on the AccessCodeRequest row it was asked
 * alongside, and cleared by the backend the moment that row is fulfilled or
 * dismissed. See AccessCodeRequest.phone.
 */
export async function requestAccessCodeAction(input: {
  parish_code: string;
  family_code: string;
  phone: string;
}) {
  return postRequest<typeof input, { family_code: string }>(
    '/self-service/request-code', input, 'none',
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
