'use server';
import { deleteRequest, getRequest, patchRequest, postRequest } from '@/services/api';
import type { Village, VillageStats, VillageAdminInfo } from '@/types';

// GET /villages/:id returns { _id, name } directly (not in standard { success, data } wrapper).
// api.ts will return the raw object cast as ApiResponse, so res.data is undefined
// but the name is on the object itself.
export async function getVillageNameAction(id: string): Promise<string | null> {
  try {
    const res = await getRequest<undefined, { name: string }>(`/villages/${id}`);
    // Standard format: res.data.name
    if (res.data?.name) return res.data.name;
    // Non-standard: the villages/:id endpoint returns { _id, name } directly
    const raw = res as unknown as { name?: string };
    if (raw.name) return raw.name;
    return null;
  } catch {
    return null;
  }
}

export async function listVillagesAction() {
  return getRequest<undefined, Village[]>('/villages');
}

export async function createVillageAction(payload: { name: string }) {
  return postRequest<{ name: string }, Village>('/villages', payload);
}

export async function updateVillageAction(id: string, payload: { name: string }) {
  return patchRequest<{ name: string }, Village>(`/villages/${id}`, payload);
}

export async function deleteVillageAction(id: string) {
  return deleteRequest<{ _id: string }>(`/villages/${id}`);
}

export async function getVillageStatsAction(id: string) {
  return getRequest<undefined, VillageStats>(`/villages/${id}/stats`);
}

export async function assignVillageAdminAction(
  id: string,
  payload: { name: string; phone: string },
) {
  return postRequest<{ name: string; phone: string }, VillageAdminInfo>(
    `/villages/${id}/admin`,
    payload,
  );
}

export async function removeVillageAdminAction(id: string) {
  return deleteRequest<{ removed: number }>(`/villages/${id}/admin`);
}
