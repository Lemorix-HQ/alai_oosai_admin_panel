'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createLookupAction,
  listLookupAction,
  type LookupKind,
} from '@/actions/lookups.actions';

/** These lists change rarely and are read on every member form. */
const LOOKUP_STALE = 5 * 60 * 1000;

/**
 * `limit` matters for the filter dropdowns: the API caps an unbounded list at
 * 50, so without it a parish's 51st occupation would silently stop being
 * filterable, with nothing on screen to say so.
 */
export function useLookup(kind: LookupKind, q?: string, limit?: number) {
  return useQuery({
    queryKey: ['lookup', kind, q ?? '', limit ?? 0],
    queryFn: () => listLookupAction(kind, q, limit),
    staleTime: LOOKUP_STALE,
  });
}

export function useCreateLookup(kind: LookupKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createLookupAction(kind, payload),
    // Every search term for this list is now stale — the new row may match any
    // of them.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lookup', kind] }),
  });
}
