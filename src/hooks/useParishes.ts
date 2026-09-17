'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignParishAdminAction,
  createParishAction,
  deleteParishAction,
  getParishStatsAction,
  listParishesAction,
  removeParishAdminAction,
  updateParishAction,
} from '@/actions/parishes.actions';
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
    mutationFn: (payload: { name: string }) => createParishAction(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parishes'] }),
  });
}

export function useUpdateParish(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) => updateParishAction(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parishes'] });
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
