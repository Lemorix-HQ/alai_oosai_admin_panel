'use server';
import { deleteRequest, getRequest, patchRequest, postRequest } from '@/services/api';
import type { Parish, ParishStats, ParishAdminInfo } from '@/types';

// GET /parishes/:id returns { _id, name } directly (not in standard { success, data } wrapper).
// api.ts will return the raw object cast as ApiResponse, so res.data is undefined
// but the name is on the object itself.
export async function getParishNameAction(id: string): Promise<string | null> {
  try {
    const res = await getRequest<undefined, { name: string }>(`/parishes/${id}`);
    // Standard format: res.data.name
    if (res.data?.name) return res.data.name;
    // Non-standard: the parishes/:id endpoint returns { _id, name } directly
    const raw = res as unknown as { name?: string };
    if (raw.name) return raw.name;
    return null;
  } catch {
    return null;
  }
}

export async function listParishesAction() {
  return getRequest<undefined, Parish[]>('/parishes');
}

export async function createParishAction(payload: { name: string }) {
  return postRequest<{ name: string }, Parish>('/parishes', payload);
}

export async function updateParishAction(id: string, payload: { name: string }) {
  return patchRequest<{ name: string }, Parish>(`/parishes/${id}`, payload);
}

export async function deleteParishAction(id: string) {
  return deleteRequest<{ _id: string }>(`/parishes/${id}`);
}

export async function getParishStatsAction(id: string) {
  return getRequest<undefined, ParishStats>(`/parishes/${id}/stats`);
}

export async function assignParishAdminAction(
  id: string,
  payload: { name: string; phone: string },
) {
  return postRequest<{ name: string; phone: string }, ParishAdminInfo>(
    `/parishes/${id}/admin`,
    payload,
  );
}

export async function removeParishAdminAction(id: string) {
  return deleteRequest<{ removed: number }>(`/parishes/${id}/admin`);
}
