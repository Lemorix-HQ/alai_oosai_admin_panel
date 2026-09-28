'use server';
import { AUTH_COOKIE } from '@/src/session/cookie';
import { cookies } from 'next/headers';
import { getRequest, postRequest } from '@/services/api';
import { redirect } from 'next/navigation';
import type { SessionUser } from '@/src/types';

/** One place that writes the session cookie, so the options cannot drift. */
async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });
}

export async function loginAction(email: string, password: string) {
  const res = await postRequest<{ email: string; password: string }, { token: string }>(
    '/auth/login',
    { email, password }
  );
  if (res.success && res.data?.token) await setSessionCookie(res.data.token);
  return res;
}

export async function inspectTokenAction(token: string) {
  return getRequest<undefined, {
    purpose: string;
    name: string;
    email: string | null;
    parish_name: string | null;
    expired: boolean;
  }>(`/auth/token/${encodeURIComponent(token)}`);
}

export async function acceptInvitationAction(
  token: string,
  password: string,
  confirm_password: string
) {
  const res = await postRequest<
    { token: string; password: string; confirm_password: string },
    { token: string }
  >('/auth/accept-invitation', { token, password, confirm_password });
  if (res.success && res.data?.token) await setSessionCookie(res.data.token);
  return res;
}

export async function forgotPasswordAction(email: string) {
  return postRequest<{ email: string }, null>('/auth/forgot-password', { email });
}

export async function resetPasswordAction(
  token: string,
  password: string,
  confirm_password: string
) {
  return postRequest<
    { token: string; password: string; confirm_password: string },
    null
  >('/auth/reset-password', { token, password, confirm_password });
}

// Phone login, retired with the screens under app/(auth)/_phone-login/. The
// backend endpoints are untouched — the Flutter app still uses them — so putting
// this back is uncommenting it.
//
// export async function sendOtpAction(phone_number: string) {
//   return postRequest<{ phone_number: string }, null>('/auth/send-otp', { phone_number });
// }
//
// export async function verifyOtpAction(phone_number: string, otp: number) {
//   const res = await postRequest<{ phone_number: string; otp: number }, { token: string }>(
//     '/auth/verify-otp',
//     { phone_number, otp }
//   );
//   if (res.success && res.data?.token) await setSessionCookie(res.data.token);
//   return res;
// }

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  redirect('/login');
}

export async function switchParishAction(parish_id: string) {
  const res = await postRequest<{ parish_id: string }, { token: string }>(
    '/auth/switch-parish',
    { parish_id },
  );
  if (res.success && res.data?.token) await setSessionCookie(res.data.token);
  return res;
}

export async function getMeAction() {
  return getRequest<undefined, SessionUser>('/auth/me');
}

