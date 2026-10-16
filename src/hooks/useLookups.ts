'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createLookupAction,
  listLookupAction,
  type LookupAudience,
  type LookupKind,
} from '@/actions/lookups.actions';

/** These lists change rarely and are read on every member form. */
const LOOKUP_STALE = 5 * 60 * 1000;

/**
 * `limit` matters for the filter dropdowns: the API caps an unbounded list at
 * 50, so without it a parish's 51st occupation would silently stop being
 * filterable, with nothing on screen to say so.
 */
export function useLookup(
  kind: LookupKind,
  q?: string,
  limit?: number,
  /** `household` reads the same list through the public form's own route. */
  audience: LookupAudience = 'staff',
) {
  return useQuery({
    // The audience is part of the key: the two routes answer with different
    // page sizes and the public one is active-only, so one cache entry must
    // not serve both.
    queryKey: ['lookup', kind, audience, q ?? '', limit ?? 0],
    queryFn: () => listLookupAction(kind, q, limit, audience),
    // Long for staff, who reopen the same combobox dozens of times a day on
    // a list that barely changes. A household opens it once, on its own
    // sitting token — `invalidateQueries` in useCreateLookup only reaches
    // the browser tab that just wrote a row, so a school staff add in
    // answer to a call never reaches an already-open household tab on its
    // own. `LookupCombobox` covers that gap by refetching this query itself
    // whenever the household reopens the dropdown.
    staleTime: audience === 'household' ? 0 : LOOKUP_STALE,
  });
}

export function useCreateLookup(kind: LookupKind, audience: LookupAudience = 'staff') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createLookupAction(kind, payload, audience),
    // Every search term for this list is now stale — the new row may match any
    // of them. Both audiences, because they are the same rows underneath.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lookup', kind] }),
  });
}
