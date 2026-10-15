'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addSodalityMemberAction,
  createSodalityAction,
  deactivateSodalityAction,
  getSodalityAction,
  leaveSodalityAction,
  listSodalitiesAction,
  listSodalityMembersAction,
  sodalityCandidatesAction,
  updateSodalityAction,
  updateSodalityMembershipAction,
  type AddSodalityMemberPayload,
  type SodalityMembersQuery,
  type SodalityPayload,
  type SodalityQuery,
} from '@/actions/sodalities.actions';
import type { SodalityMembershipRole } from '@/src/types';

/** Everything downstream of a sodality edit, invalidated together. */
function invalidateSodalities(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['sodalities'] });
}

export function useSodalities(query: SodalityQuery = {}) {
  return useQuery({
    queryKey: ['sodalities', query],
    queryFn: () => listSodalitiesAction(query),
    staleTime: 30 * 1000,
  });
}

export function useSodality(id: string) {
  return useQuery({
    queryKey: ['sodality', id],
    queryFn: () => getSodalityAction(id),
    enabled: !!id,
  });
}

export function useCreateSodality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SodalityPayload) => createSodalityAction(payload),
    onSuccess: () => invalidateSodalities(qc),
  });
}

export function useUpdateSodality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SodalityPayload> }) =>
      updateSodalityAction(id, payload),
    onSuccess: (_res, vars) => {
      invalidateSodalities(qc);
      qc.invalidateQueries({ queryKey: ['sodality', vars.id] });
    },
  });
}

export function useDeactivateSodality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateSodalityAction(id),
    onSuccess: () => invalidateSodalities(qc),
  });
}

/**
 * Nested under the parent key — ['sodality', id] — so ending or adding a
 * membership invalidates the roster by prefix without either side needing to
 * know the other exists.
 */
export function useSodalityMembers(id: string, query: SodalityMembersQuery = {}) {
  return useQuery({
    queryKey: ['sodality', id, 'members', query],
    queryFn: () => listSodalityMembersAction(id, query),
    enabled: !!id,
  });
}

export function useAddSodalityMember(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddSodalityMemberPayload) => addSodalityMemberAction(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sodality', id] }),
  });
}

export function useUpdateSodalityMembership(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, role }: { membershipId: string; role: SodalityMembershipRole }) =>
      updateSodalityMembershipAction(id, membershipId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sodality', id] }),
  });
}

export function useLeaveSodality(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => leaveSodalityAction(id, membershipId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sodality', id] }),
  });
}

/** `enabled: false` holds the search back — used until the caller has typed enough to search for. */
export function useSodalityCandidates(id: string, q: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['sodality-candidates', id, q],
    queryFn: () => sodalityCandidatesAction(id, q),
    enabled: (options.enabled ?? true) && !!id && q.trim().length >= 2,
  });
}
