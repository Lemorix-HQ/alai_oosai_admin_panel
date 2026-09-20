'use server';

import { deleteRequest, getRequest, patchRequest, postRequest } from '@/services/api';
import type {
  Address,
  Parish,
  ParishAdminInfo,
  ParishSettings,
  ParishStatsDetail,
  ParishWithCounts,
} from '@/src/types';

export async function getParishNameAction(id: string): Promise<string | null> {
  try {
    const res = await getRequest<undefined, { name: string }>(`/parishes/${id}`);
    if (res.data?.name) return res.data.name;
    // GET /parishes/:id used to return a bare { _id, name }. Kept so a panel
    // deployed ahead of the API still renders its header.
    const raw = res as unknown as { name?: string };
    return raw.name ?? null;
  } catch {
    return null;
  }
}

export async function listParishesAction() {
  return getRequest<undefined, ParishWithCounts[]>('/parishes');
}

export async function getParishAction(id: string) {
  return getRequest<undefined, Parish>(`/parishes/${id}`);
}

export interface ParishPayload {
  name: string;
  /** Prefixes issued certificate numbers, so it is required and unique. */
  code: string;
  name_ta?: string;
  patron_saint?: string;
  diocese?: string;
  deanery?: string;
  phone?: string;
  alt_phone?: string;
  email?: string;
  logo?: string;
  established_on?: string;
  address?: Address;
}

export async function createParishAction(payload: ParishPayload) {
  return postRequest<ParishPayload, Parish>('/parishes', payload);
}

export async function updateParishAction(id: string, payload: Partial<ParishPayload>) {
  return patchRequest<Partial<ParishPayload>, Parish>(`/parishes/${id}`, payload);
}

/** Pastoral configuration. A different permission from updateParishAction. */
export async function updateParishSettingsAction(
  id: string,
  payload: Partial<ParishSettings>,
) {
  return patchRequest<Partial<ParishSettings>, Parish>(`/parishes/${id}/settings`, payload);
}

export async function deleteParishAction(id: string) {
  return deleteRequest<{ _id: string }>(`/parishes/${id}`);
}

export async function getParishStatsAction(id: string) {
  return getRequest<undefined, ParishStatsDetail>(`/parishes/${id}/stats`);
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
