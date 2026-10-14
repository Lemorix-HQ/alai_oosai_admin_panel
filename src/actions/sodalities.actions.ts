'use server';

import { deleteRequest, getRequest, patchRequest, postRequest } from '@/services/api';
import type { Paged, Sodality, SodalityCandidate, SodalityMembership, SodalityMembershipRole } from '@/src/types';

export interface SodalityQuery {
  q?: string;
  status?: string;
  with_counts?: string;
  page?: string;
  limit?: string;
}

export interface SodalityPayload {
  name: string;
  code: string;
  name_ta?: string;
  patron_saint?: string;
}

export async function listSodalitiesAction(query: SodalityQuery = {}) {
  return getRequest<SodalityQuery, Paged<Sodality>>('/sodalities', query);
}

export async function getSodalityAction(id: string) {
  return getRequest<undefined, Sodality>(`/sodalities/${id}`);
}

export async function createSodalityAction(payload: SodalityPayload) {
  return postRequest<SodalityPayload, Sodality>('/sodalities', payload);
}

export async function updateSodalityAction(id: string, payload: Partial<SodalityPayload>) {
  return patchRequest<Partial<SodalityPayload>, Sodality>(`/sodalities/${id}`, payload);
}

export async function deactivateSodalityAction(id: string) {
  return deleteRequest<Sodality>(`/sodalities/${id}`);
}

export interface SodalityMembersQuery {
  include_past?: string;
  page?: string;
  limit?: string;
}

export async function listSodalityMembersAction(id: string, query: SodalityMembersQuery = {}) {
  return getRequest<SodalityMembersQuery, Paged<SodalityMembership>>(`/sodalities/${id}/members`, query);
}

export interface AddSodalityMemberPayload {
  member_id: string;
  role?: SodalityMembershipRole;
  joined_on?: string;
}

export async function addSodalityMemberAction(id: string, payload: AddSodalityMemberPayload) {
  return postRequest<AddSodalityMemberPayload, SodalityMembership>(`/sodalities/${id}/members`, payload);
}

export async function updateSodalityMembershipAction(
  id: string,
  membershipId: string,
  role: SodalityMembershipRole
) {
  return patchRequest<{ role: SodalityMembershipRole }, SodalityMembership>(
    `/sodalities/${id}/members/${membershipId}`,
    { role }
  );
}

export async function leaveSodalityAction(id: string, membershipId: string) {
  return postRequest<undefined, SodalityMembership>(`/sodalities/${id}/members/${membershipId}/leave`);
}

/**
 * The narrow member search for enrolment — never member.read. See
 * sodality.service.ts in the backend for why.
 */
export async function sodalityCandidatesAction(id: string, q: string) {
  return getRequest<{ q: string }, SodalityCandidate[]>(`/sodalities/${id}/candidates`, { q });
}
