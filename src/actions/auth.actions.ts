'use server';
import { cookies } from 'next/headers';
import { getRequest, postRequest } from '@/services/api';
import { redirect } from 'next/navigation';

export async function sendOtpAction(phone_number: string) {
  return postRequest<{ phone_number: string }, null>('/auth/send-otp', { phone_number });
}

export async function verifyOtpAction(phone_number: string, otp: number) {
  const res = await postRequest<{ phone_number: string; otp: number }, { token: string }>(
    '/auth/verify-otp',
    { phone_number, otp }
  );
  if (res.success && res.data?.token) {
    const cookieStore = await cookies();
    cookieStore.set('admin_token', res.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
  }
  return res;
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  redirect('/login');
}

export async function switchVillageAction(village_id: string) {
  const res = await postRequest<{ village_id: string }, { token: string }>(
    '/auth/switch-village',
    { village_id },
  );
  if (res.success && res.data?.token) {
    const cookieStore = await cookies();
    cookieStore.set('admin_token', res.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
  }
  return res;
}

export async function getMeAction() {
  return getRequest<
    undefined,
    { id: string; name: string; phone: string; role: string; village_id: string | null }
  >('/auth/me');
}

