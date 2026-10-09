'use server';

import { getRequest, postRequest } from '@/services/api';
import type { College, Occupation, Place, School } from '@/src/types';

export type LookupKind = 'school' | 'college' | 'occupation' | 'place';
export type LookupRow = School | College | Occupation | Place;

/**
 * Who is asking.
 *
 * `staff` is the signed-in panel. `household` is the public `/family-update`
 * form, which reaches the same four lists through `/self-service/lookups/:kind`
 * carrying its sitting token — the staff routes need `member.read`, which
 * nobody holds on a public page.
 *
 * Two paths rather than one relaxed route: the staff routes stay guarded
 * exactly as they were, and what a household may send is a strict subset
 * (`HouseholdLookupCreateDto`) rather than the clerk's full body.
 */
export type LookupAudience = 'staff' | 'household';

const PATH: Record<LookupKind, string> = {
  school: '/schools',
  college: '/colleges',
  occupation: '/occupations',
  place: '/places',
};

/** The household's door to the same list, named by kind rather than plural. */
const HOUSEHOLD_PATH: Record<LookupKind, string> = {
  school: '/self-service/lookups/school',
  college: '/self-service/lookups/college',
  occupation: '/self-service/lookups/occupation',
  place: '/self-service/lookups/place',
};

export async function listLookupAction(
  kind: LookupKind,
  q?: string,
  limit?: number,
  audience: LookupAudience = 'staff',
) {
  if (audience === 'household') {
    // No `limit`: the server decides the page size for a public caller, and
    // `status` is not offered at all — a retired entry must not be offered for
    // a new record.
    return getRequest<{ q?: string }, LookupRow[]>(
      HOUSEHOLD_PATH[kind], { ...(q ? { q } : {}) }, undefined, 'sitting',
    );
  }
  return getRequest<{ q?: string; limit?: number }, LookupRow[]>(PATH[kind], {
    ...(q ? { q } : {}),
    ...(limit ? { limit } : {}),
  });
}

/**
 * Idempotent on the server: posting a name the parish already holds returns
 * that row rather than erroring, so two faculty adding the same school from
 * two doors on the same evening converge on one entry — and so do two
 * households on the same evening.
 */
export async function createLookupAction(
  kind: LookupKind,
  payload: Record<string, unknown>,
  audience: LookupAudience = 'staff',
) {
  if (audience === 'household') {
    return postRequest<Record<string, unknown>, LookupRow>(
      HOUSEHOLD_PATH[kind], payload, 'sitting',
    );
  }
  return postRequest<Record<string, unknown>, LookupRow>(PATH[kind], payload);
}
