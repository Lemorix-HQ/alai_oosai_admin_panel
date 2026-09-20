'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignParishAdminAction,
  createParishAction,
  deleteParishAction,
  getParishAction,
  getParishStatsAction,
  listParishesAction,
  removeParishAdminAction,
  updateParishAction,
  updateParishSettingsAction,
  type ParishPayload,
} from '@/actions/parishes.actions';
import type { ParishSettings } from '@/src/types';
import { switchParishAction } from '@/actions/auth.actions';

export function useParishes() {
  return useQuery({
    queryKey: ['parishes'],
    queryFn: () => listParishesAction(),
    staleTime: 60 * 1000,
  });
}

export function useParishStats(id: string) {
  return useQuery({
    queryKey: ['parish-stats', id],
    queryFn: () => getParishStatsAction(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateParish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ParishPayload) => createParishAction(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parishes'] }),
  });
}

export function useUpdateParish(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ParishPayload>) => updateParishAction(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parishes'] });
      queryClient.invalidateQueries({ queryKey: ['parish', id] });
      queryClient.invalidateQueries({ queryKey: ['parish-stats', id] });
    },
  });
}

export function useParish(id: string) {
  return useQuery({
    queryKey: ['parish', id],
    queryFn: () => getParishAction(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useUpdateParishSettings(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ParishSettings>) => updateParishSettingsAction(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parish', id] });
      queryClient.invalidateQueries({ queryKey: ['parish-stats', id] });
    },
  });
}

export function useDeleteParish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteParishAction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parishes'] }),
  });
}

export function useAssignParishAdmin(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; phone: string }) =>
      assignParishAdminAction(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parish-stats', id] }),
  });
}

export function useRemoveParishAdmin(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => removeParishAdminAction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parish-stats', id] }),
  });
}

export function useSwitchParish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (parishId: string) => switchParishAction(parishId),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
