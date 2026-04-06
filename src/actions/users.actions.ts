'use server';
import { patchRequest } from '@/services/api';

export async function updateUserNameAction(userId: string, name: string) {
  return patchRequest<{ name: string }, null>(`/users/${userId}`, { name });
}
