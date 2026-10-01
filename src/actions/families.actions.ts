'use server';

import { deleteRequest, getRequest, patchRequest, postRequest } from '@/services/api';
import type {
  Address,
  Family,
  FamilyDetail,
  FamilyTransfer,
  Member,
  MemberRelationship,
  Paged,
  PastoralFlag,
  Residence,
} from '@/src/types';

export interface FamilyQuery {
  q?: string;
  anbiyam_id?: string;
  mandalam_id?: string;
  verification_status?: string;
  residence_status?: string;
  members_complete?: string;
  status?: string;
  page?: string;
  limit?: string;
}

export async function listFamiliesAction(query: FamilyQuery = {}) {
  return getRequest<FamilyQuery, Paged<Family>>('/families', query);
}

export async function getFamilyAction(id: string) {
  return getRequest<undefined, FamilyDetail>(`/families/${id}`);
}

export interface CreateFamilyPayload {
  anbiyam_id: string;
  /** Omit to take the lowest free serial. */
  serial_in_anbiyam?: number;
  card_year?: number;
  primary_phone?: string;
  address?: Address;
  locality?: string;
  house_note?: string;
  residence?: Residence;
  pastoral_flags?: PastoralFlag[];
  notes?: string;
  head_name?: string;
  head_name_ta?: string;
  spouse_name?: string;
  spouse_name_ta?: string;
}

export async function createFamilyAction(payload: CreateFamilyPayload) {
  return postRequest<CreateFamilyPayload, Family>('/families', payload);
}

/**
 * Editable fields only.
 *
 * `anbiyam_id` and `serial_in_anbiyam` are deliberately absent: moving a family
 * issues a new family code and is a transfer, not a field edit.
 */
export interface UpdateFamilyPayload {
  primary_phone?: string;
  address?: Address;
  locality?: string;
  house_note?: string;
  residence?: Residence;
  pastoral_flags?: PastoralFlag[];
  notes?: string;
  card_year?: number;
  head_member_id?: string;
  spouse_member_id?: string;
  members_complete?: boolean;
}

export async function updateFamilyAction(id: string, payload: UpdateFamilyPayload) {
  return patchRequest<UpdateFamilyPayload, Family>(`/families/${id}`, payload);
}

export interface TransferFamilyPayload {
  to_anbiyam_id: string;
  effective_on: string;
  reason?: string;
  assignment_method?: 'vacant_slot' | 'appended';
}

export async function transferFamilyAction(id: string, payload: TransferFamilyPayload) {
  return postRequest<TransferFamilyPayload, { family: Family; transfer: FamilyTransfer }>(
    `/families/${id}/transfer`,
    payload,
  );
}

export interface CloseFamilyPayload {
  status: 'transferred_out' | 'closed' | 'merged';
  reason?: string;
}

export async function closeFamilyAction(id: string, payload: CloseFamilyPayload) {
  return postRequest<CloseFamilyPayload, Family>(`/families/${id}/close`, payload);
}

// ------------------------------------------------------------------- members

export interface MemberPayload {
  name: string;
  gender: 'male' | 'female';
  relationship_to_head: MemberRelationship;
  name_ta?: string;
  baptismal_name?: string;
  initial?: string;
  date_of_birth?: string;
  dob_is_estimated?: boolean;
  marital_status?: string;
  occupation?: string;
  education?: string;
  phone?: string;
  email?: string;
  blood_group?: string;
  notes?: string;
}

export async function addMemberAction(familyId: string, payload: MemberPayload) {
  return postRequest<MemberPayload, Member>(`/families/${familyId}/members`, payload);
}

export async function getMemberAction(id: string) {
  return getRequest<undefined, Member & { family_id: { _id: string; family_code: string } }>(
    `/members/${id}`,
  );
}

export async function listMembersAction(query: FamilyQuery = {}) {
  return getRequest<FamilyQuery, Paged<Member>>('/members', query);
}

export async function updateMemberAction(
  id: string,
  payload: Partial<MemberPayload> & { status?: string },
) {
  return patchRequest<Partial<MemberPayload> & { status?: string }, Member>(
    `/members/${id}`,
    payload,
  );
}

export async function removeMemberAction(id: string) {
  return deleteRequest<{ _id: string }>(`/members/${id}`);
}
