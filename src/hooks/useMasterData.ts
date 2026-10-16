'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteLookupAction,
  listMasterDataAction,
  updateLookupAction,
  type LookupKind,
} from '@/actions/lookups.actions';

export function useMasterData(kind: LookupKind, opts?: { q?: string; status?: string }) {
  return useQuery({
    queryKey: ['master-data', kind, opts?.q, opts?.status],
    queryFn: () =>
      listMasterDataAction(kind, {
        q: opts?.q,
        status: (opts?.status as 'active' | 'inactive' | 'all') ?? 'all',
      }),
    staleTime: 30 * 1000,
  });
}

export function useUpdateLookup(kind: LookupKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateLookupAction(kind, id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-data', kind] }),
  });
}

export function useDeleteLookup(kind: LookupKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLookupAction(kind, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-data', kind] }),
  });
}
