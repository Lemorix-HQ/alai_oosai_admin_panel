'use server';

import { getRequest, postRequest } from '@/services/api';
import type { College, Occupation, Place, School } from '@/src/types';

export type LookupKind = 'school' | 'college' | 'occupation' | 'place';
export type LookupRow = School | College | Occupation | Place;

const PATH: Record<LookupKind, string> = {
  school: '/schools',
  college: '/colleges',
  occupation: '/occupations',
  place: '/places',
};

export async function listLookupAction(kind: LookupKind, q?: string, limit?: number) {
  return getRequest<{ q?: string; limit?: number }, LookupRow[]>(PATH[kind], {
    ...(q ? { q } : {}),
    ...(limit ? { limit } : {}),
  });
}

/**
 * Idempotent on the server: posting a name the parish already holds returns
 * that row rather than erroring, so two faculty adding the same school from
 * two doors on the same evening converge on one entry.
 */
export async function createLookupAction(kind: LookupKind, payload: Record<string, unknown>) {
  return postRequest<Record<string, unknown>, LookupRow>(PATH[kind], payload);
}
