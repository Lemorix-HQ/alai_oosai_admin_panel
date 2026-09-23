'use server';

import { getRequest, patchRequest, postRequest } from '@/services/api';
import type {
  ChangeRequest,
  ChangeRequestType,
  FamilyVisit,
  Paged,
  VisitOutcome,
  VisitRound,
  VisitRoundDetail,
} from '@/src/types';

// -------------------------------------------------------------- visit rounds

export interface VisitRoundQuery {
  anbiyam_id?: string;
  status?: string;
  page?: string;
  limit?: string;
}

export async function listVisitRoundsAction(query: VisitRoundQuery = {}) {
  return getRequest<VisitRoundQuery, Paged<VisitRound>>('/visit-rounds', query);
}

export async function getVisitRoundAction(id: string) {
  return getRequest<undefined, VisitRoundDetail>(`/visit-rounds/${id}`);
}

export interface CreateVisitRoundPayload {
  anbiyam_id: string;
  round_date: string;
  label?: string;
  /** Omit to snapshot the Anbiyam's active family count as the denominator. */
  total_families?: number;
  notes?: string;
}

export async function createVisitRoundAction(payload: CreateVisitRoundPayload) {
  return postRequest<CreateVisitRoundPayload, VisitRound>('/visit-rounds', payload);
}

export interface UpdateVisitRoundPayload {
  label?: string;
  round_date?: string;
  notes?: string;
}

export async function updateVisitRoundAction(id: string, payload: UpdateVisitRoundPayload) {
  return patchRequest<UpdateVisitRoundPayload, VisitRound>(`/visit-rounds/${id}`, payload);
}

export async function completeVisitRoundAction(id: string) {
  return postRequest<Record<string, never>, VisitRound>(`/visit-rounds/${id}/complete`, {});
}

// --------------------------------------------------------------------- visits

export interface VisitQuery {
  family_id?: string;
  round_id?: string;
  anbiyam_id?: string;
  outcome?: string;
  page?: string;
  limit?: string;
}

export async function listVisitsAction(query: VisitQuery = {}) {
  return getRequest<VisitQuery, Paged<FamilyVisit>>('/visits', query);
}

export interface RecordVisitPayload {
  family_id: string;
  visit_date: string;
  round_id?: string;
  outcome?: VisitOutcome;
  visited_by_name?: string;
  notes?: string;
  follow_up_flags?: string[];
  acknowledged_by_member_id?: string;
  acknowledgement?: string;
  /** The door step is where a family's member list is settled. */
  members_complete?: boolean;
}

export async function recordVisitAction(payload: RecordVisitPayload) {
  return postRequest<RecordVisitPayload, FamilyVisit>('/visits', payload);
}

// ------------------------------------------------------------ change requests

export interface ChangeRequestQuery {
  status?: string;
  type?: string;
  family_id?: string;
  anbiyam_id?: string;
  page?: string;
  limit?: string;
}

export async function listChangeRequestsAction(query: ChangeRequestQuery = {}) {
  return getRequest<ChangeRequestQuery, Paged<ChangeRequest>>('/change-requests', query);
}

export async function getChangeRequestAction(id: string) {
  return getRequest<undefined, ChangeRequest>(`/change-requests/${id}`);
}

export interface RaiseChangeRequestPayload {
  type: ChangeRequestType;
  family_id?: string;
  payload?: Record<string, unknown>;
  reason?: string;
  requester_name?: string;
  requester_phone?: string;
}

export async function raiseChangeRequestAction(payload: RaiseChangeRequestPayload) {
  return postRequest<RaiseChangeRequestPayload, ChangeRequest>('/change-requests', payload);
}

export interface DecisionPayload {
  decision_note?: string;
}

export async function verifyChangeRequestAction(id: string, payload: DecisionPayload = {}) {
  return postRequest<DecisionPayload, ChangeRequest>(`/change-requests/${id}/verify`, payload);
}

export async function approveChangeRequestAction(id: string, payload: DecisionPayload = {}) {
  return postRequest<DecisionPayload, ChangeRequest>(`/change-requests/${id}/approve`, payload);
}

export async function rejectChangeRequestAction(id: string, payload: DecisionPayload = {}) {
  return postRequest<DecisionPayload, ChangeRequest>(`/change-requests/${id}/reject`, payload);
}

export interface ApplyPayload extends DecisionPayload {
  resulting_family_id?: string;
  resulting_member_id?: string;
}

export async function applyChangeRequestAction(id: string, payload: ApplyPayload = {}) {
  return postRequest<ApplyPayload, ChangeRequest>(`/change-requests/${id}/apply`, payload);
}

export async function cancelChangeRequestAction(id: string) {
  return postRequest<Record<string, never>, ChangeRequest>(`/change-requests/${id}/cancel`, {});
}
