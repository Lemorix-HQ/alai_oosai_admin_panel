'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addMemberAction,
  closeFamilyAction,
  createFamilyAction,
  getFamilyAction,
  getFamilyTimelineAction,
  getMemberAction,
  listFamiliesAction,
  listMembersAction,
  removeMemberAction,
  transferFamilyAction,
  updateFamilyAction,
  updateMemberAction,
  type CloseFamilyPayload,
  type CreateFamilyPayload,
  type FamilyQuery,
  type MemberPayload,
  type TransferFamilyPayload,
  type UpdateFamilyPayload,
} from '@/actions/families.actions';

/** `enabled: false` holds the request back — used by search boxes with nothing typed yet. */
export function useFamilies(query: FamilyQuery = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['families', query],
    queryFn: () => listFamiliesAction(query),
    staleTime: 30 * 1000,
    enabled: options.enabled ?? true,
  });
}

export function useFamily(id: string) {
  return useQuery({
    queryKey: ['family', id],
    queryFn: () => getFamilyAction(id),
    enabled: !!id,
  });
}

/**
 * Keyed UNDER the family rather than beside it.
 *
 * Every mutation that changes a household's history already invalidates
 * `['family', id]`, and TanStack matches by key prefix — so adding a member or
 * closing the card refreshes the timeline without any of them having to know
 * the timeline exists.
 */
export function useFamilyTimeline(id: string) {
  return useQuery({
    queryKey: ['family', id, 'timeline'],
    queryFn: () => getFamilyTimelineAction(id),
    enabled: !!id,
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['member', id],
    queryFn: () => getMemberAction(id),
    enabled: !!id,
  });
}

export function useMembers(query: FamilyQuery = {}) {
  return useQuery({
    queryKey: ['members', query],
    queryFn: () => listMembersAction(query),
    staleTime: 30 * 1000,
  });
}

export function useCreateFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFamilyPayload) => createFamilyAction(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['families'] });
      // A new family changes the Anbiyam's count and the next free serial.
      qc.invalidateQueries({ queryKey: ['anbiyams'] });
      qc.invalidateQueries({ queryKey: ['structure'] });
    },
  });
}

export function useUpdateFamily(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFamilyPayload) => updateFamilyAction(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family', id] });
      qc.invalidateQueries({ queryKey: ['families'] });
    },
  });
}

/** A transfer reissues the family code, so the list and the card both change. */
export function useTransferFamily(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransferFamilyPayload) => transferFamilyAction(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family', id] });
      qc.invalidateQueries({ queryKey: ['families'] });
      qc.invalidateQueries({ queryKey: ['anbiyams'] });
      qc.invalidateQueries({ queryKey: ['structure'] });
    },
  });
}

/** Closing a family frees its serial for the next household in that Anbiyam. */
export function useCloseFamily(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CloseFamilyPayload) => closeFamilyAction(id, payload),
    onSuccess: () => {
      // Every family card, not just this one: a merge that moves the members
      // changes the destination's card as much as it changes this one.
      qc.invalidateQueries({ queryKey: ['family'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['families'] });
      qc.invalidateQueries({ queryKey: ['anbiyams'] });
      qc.invalidateQueries({ queryKey: ['structure'] });
    },
  });
}

export function useAddMember(familyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MemberPayload) => addMemberAction(familyId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family', familyId] });
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useUpdateMember(familyId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<MemberPayload> & { status?: string };
    }) => updateMemberAction(id, payload),
    onSuccess: (_res, { id }) => {
      if (familyId) qc.invalidateQueries({ queryKey: ['family', familyId] });
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['member', id] });
    },
  });
}

export function useRemoveMember(familyId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeMemberAction(id),
    onSuccess: () => {
      if (familyId) qc.invalidateQueries({ queryKey: ['family', familyId] });
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });
}
