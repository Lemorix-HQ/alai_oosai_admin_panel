'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAccessCodeStatusAction,
  issueAccessCodeAction,
  revokeAccessCodeAction,
} from '@/actions/self-service.actions';

export function useAccessCodeStatus(familyId: string, enabled = true) {
  return useQuery({
    queryKey: ['access-code', familyId],
    queryFn: () => getAccessCodeStatusAction(familyId),
    enabled: enabled && !!familyId,
    // Short, because the state changes when somebody else in the parish issues
    // or revokes one, and two people handing out codes at the same Anbiyam
    // meeting is the expected case rather than a rare one.
    staleTime: 15 * 1000,
  });
}

/**
 * The issued code is returned to the caller and deliberately NOT written into
 * the query cache: a reveal-once secret must not survive in memory that another
 * component can read, or reappear when this card is remounted. The caller holds
 * it in local state for as long as the panel is open.
 */
export function useIssueAccessCode(familyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => issueAccessCodeAction(familyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-code', familyId] });
      qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}

export function useRevokeAccessCode(familyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => revokeAccessCodeAction(familyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-code', familyId] });
      qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}
