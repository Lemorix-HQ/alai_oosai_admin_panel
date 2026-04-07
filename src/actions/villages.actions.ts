'use server';
import { getRequest } from '@/services/api';

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
