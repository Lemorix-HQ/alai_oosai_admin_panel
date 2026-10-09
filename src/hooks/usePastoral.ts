'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyChangeRequestAction,
  approveChangeRequestAction,
  cancelChangeRequestAction,
  completeVisitRoundAction,
  createVisitRoundAction,
  getChangeRequestAction,
  getVisitRoundAction,
  listChangeRequestsAction,
  listVisitRoundsAction,
  listVisitsAction,
  raiseChangeRequestAction,
  recordVisitAction,
  rejectChangeRequestAction,
  updateVisitRoundAction,
  verifyChangeRequestAction,
  decideSubmissionAction,
  getSubmissionAction,
  listSubmissionsAction,
  type SubmissionQuery,
  type ApplyPayload,
  type ChangeRequestQuery,
  type CreateVisitRoundPayload,
  type DecisionPayload,
  type RaiseChangeRequestPayload,
  type RecordVisitPayload,
  type UpdateVisitRoundPayload,
  type VisitQuery,
  type VisitRoundQuery,
} from '@/actions/pastoral.actions';
import type { ApiResponse, ChangeRequest } from '@/src/types';

export function useVisitRounds(query: VisitRoundQuery = {}) {
  return useQuery({
    queryKey: ['visit-rounds', query],
    queryFn: () => listVisitRoundsAction(query),
    staleTime: 30 * 1000,
  });
}

export function useVisitRound(id: string) {
  return useQuery({
    queryKey: ['visit-round', id],
    queryFn: () => getVisitRoundAction(id),
    enabled: !!id,
  });
}

export function useVisits(query: VisitQuery = {}) {
  return useQuery({
    queryKey: ['visits', query],
    queryFn: () => listVisitsAction(query),
    staleTime: 30 * 1000,
  });
}

export function useCreateVisitRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVisitRoundPayload) => createVisitRoundAction(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['visit-rounds'] }),
  });
}

export function useUpdateVisitRound(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateVisitRoundPayload) => updateVisitRoundAction(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visit-round', id] });
      qc.invalidateQueries({ queryKey: ['visit-rounds'] });
    },
  });
}

export function useCompleteVisitRound(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => completeVisitRoundAction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visit-round', id] });
      qc.invalidateQueries({ queryKey: ['visit-rounds'] });
    },
  });
}

/**
 * A visit changes the family it was made to — its verification status, its
 * date, and whether its member list is settled — so the family caches go too.
 */
export function useRecordVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordVisitPayload) => recordVisitAction(payload),
    onSuccess: (_res, payload) => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['families'] });
      qc.invalidateQueries({ queryKey: ['family', payload.family_id] });
      if (payload.round_id) qc.invalidateQueries({ queryKey: ['visit-round', payload.round_id] });
      qc.invalidateQueries({ queryKey: ['visit-rounds'] });
    },
  });
}

export function useChangeRequests(query: ChangeRequestQuery = {}) {
  return useQuery({
    queryKey: ['change-requests', query],
    queryFn: () => listChangeRequestsAction(query),
    staleTime: 15 * 1000,
  });
}

export function useChangeRequest(id: string) {
  return useQuery({
    queryKey: ['change-request', id],
    queryFn: () => getChangeRequestAction(id),
    enabled: !!id,
  });
}

export function useRaiseChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RaiseChangeRequestPayload) => raiseChangeRequestAction(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['change-requests'] }),
  });
}

/**
 * Verify, approve, reject, apply and cancel all land on one request and all
 * move its status, so they share an invalidation.
 */
function useDecision(
  id: string,
  fn: (id: string, payload: ApplyPayload) => Promise<ApiResponse<ChangeRequest>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DecisionPayload | ApplyPayload = {}) => fn(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-request', id] });
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      // Applying one adds a member or moves a family.
      qc.invalidateQueries({ queryKey: ['families'] });
      qc.invalidateQueries({ queryKey: ['family'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}

export const useVerifyChangeRequest = (id: string) => useDecision(id, verifyChangeRequestAction);
export const useApproveChangeRequest = (id: string) => useDecision(id, approveChangeRequestAction);
export const useRejectChangeRequest = (id: string) => useDecision(id, rejectChangeRequestAction);
export const useApplyChangeRequest = (id: string) => useDecision(id, applyChangeRequestAction);

export function useCancelChangeRequest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cancelChangeRequestAction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-request', id] });
      qc.invalidateQueries({ queryKey: ['change-requests'] });
    },
  });
}

// ------------------------------------------------ self-service submissions

export function useSubmissions(query: SubmissionQuery = {}) {
  return useQuery({
    queryKey: ['submissions', query],
    queryFn: () => listSubmissionsAction(query),
    staleTime: 15 * 1000,
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: ['submission', id],
    queryFn: () => getSubmissionAction(id),
    enabled: !!id,
  });
}

/**
 * All four group decisions move the same row and the requests under it, so they
 * share an invalidation — including `families` and `members`, because applying
 * a sitting writes to both, and `visit-round`, because the worksheet flags
 * households that still have one waiting.
 */
export function useDecideSubmission(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { action: 'verify' | 'approve' | 'reject' | 'apply'; note?: string }) =>
      decideSubmissionAction(id, vars.action, vars.note ? { decision_note: vars.note } : {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submission', id] });
      qc.invalidateQueries({ queryKey: ['submissions'] });
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      qc.invalidateQueries({ queryKey: ['visit-round'] });
      qc.invalidateQueries({ queryKey: ['families'] });
      qc.invalidateQueries({ queryKey: ['family'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}
