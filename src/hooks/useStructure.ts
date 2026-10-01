'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAnbiyamAction,
  createMandalamAction,
  createSubstationAction,
  deactivateAnbiyamAction,
  deactivateMandalamAction,
  getAnbiyamAction,
  getNextSerialAction,
  getStructureTreeAction,
  listAnbiyamsAction,
  listMandalamsAction,
  listSubstationsAction,
  updateAnbiyamAction,
  updateMandalamAction,
  updateSubstationAction,
  type AnbiyamPayload,
  type MandalamPayload,
  type StructureQuery,
  type SubstationPayload,
} from '@/actions/structure.actions';

/**
 * Structure changes rarely and is read on nearly every page (every family form
 * needs the Anbiyam list), so it is cached for a few minutes rather than
 * refetched per mount.
 */
const STRUCTURE_STALE = 5 * 60 * 1000;

/** Everything downstream of a structure edit, invalidated together. */
function invalidateStructure(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['structure'] });
  qc.invalidateQueries({ queryKey: ['mandalams'] });
  qc.invalidateQueries({ queryKey: ['anbiyams'] });
}

export function useStructureTree() {
  return useQuery({
    queryKey: ['structure', 'tree'],
    queryFn: () => getStructureTreeAction(),
    staleTime: STRUCTURE_STALE,
  });
}

export function useMandalams(query: StructureQuery = {}) {
  return useQuery({
    queryKey: ['mandalams', query],
    queryFn: () => listMandalamsAction(query),
    staleTime: STRUCTURE_STALE,
  });
}

export function useAnbiyams(query: StructureQuery = {}) {
  return useQuery({
    queryKey: ['anbiyams', query],
    queryFn: () => listAnbiyamsAction(query),
    staleTime: STRUCTURE_STALE,
  });
}

export function useAnbiyam(id: string) {
  return useQuery({
    queryKey: ['anbiyam', id],
    queryFn: () => getAnbiyamAction(id),
    enabled: !!id,
  });
}

/**
 * Not cached. The next free serial can be taken by another admin between the
 * form opening and it being submitted, so it is read fresh each time and the
 * server allocates the real one on create.
 */
export function useNextSerial(anbiyamId: string) {
  return useQuery({
    queryKey: ['next-serial', anbiyamId],
    queryFn: () => getNextSerialAction(anbiyamId),
    enabled: !!anbiyamId,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useSubstations() {
  return useQuery({
    queryKey: ['substations'],
    queryFn: () => listSubstationsAction(),
    staleTime: STRUCTURE_STALE,
  });
}

export function useCreateMandalam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MandalamPayload) => createMandalamAction(payload),
    onSuccess: () => invalidateStructure(qc),
  });
}

export function useUpdateMandalam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MandalamPayload> }) =>
      updateMandalamAction(id, payload),
    onSuccess: () => invalidateStructure(qc),
  });
}

export function useDeactivateMandalam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateMandalamAction(id),
    onSuccess: () => invalidateStructure(qc),
  });
}

export function useCreateAnbiyam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AnbiyamPayload) => createAnbiyamAction(payload),
    onSuccess: () => invalidateStructure(qc),
  });
}

export function useUpdateAnbiyam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AnbiyamPayload> }) =>
      updateAnbiyamAction(id, payload),
    onSuccess: (_res, vars) => {
      invalidateStructure(qc);
      qc.invalidateQueries({ queryKey: ['anbiyam', vars.id] });
    },
  });
}

export function useDeactivateAnbiyam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateAnbiyamAction(id),
    onSuccess: () => invalidateStructure(qc),
  });
}

export function useCreateSubstation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubstationPayload) => createSubstationAction(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['substations'] }),
  });
}

export function useUpdateSubstation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SubstationPayload> }) =>
      updateSubstationAction(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['substations'] }),
  });
}
