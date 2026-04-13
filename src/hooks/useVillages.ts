'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignVillageAdminAction,
  createVillageAction,
  deleteVillageAction,
  getVillageStatsAction,
  listVillagesAction,
  removeVillageAdminAction,
  updateVillageAction,
} from '@/actions/villages.actions';
import { switchVillageAction } from '@/actions/auth.actions';

export function useVillages() {
  return useQuery({
    queryKey: ['villages'],
    queryFn: () => listVillagesAction(),
    staleTime: 60 * 1000,
  });
}

export function useVillageStats(id: string) {
  return useQuery({
    queryKey: ['village-stats', id],
    queryFn: () => getVillageStatsAction(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateVillage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) => createVillageAction(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['villages'] }),
  });
}

export function useUpdateVillage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) => updateVillageAction(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['villages'] });
      queryClient.invalidateQueries({ queryKey: ['village-stats', id] });
    },
  });
}

export function useDeleteVillage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVillageAction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['villages'] }),
  });
}

export function useAssignVillageAdmin(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; phone: string }) =>
      assignVillageAdminAction(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['village-stats', id] }),
  });
}

export function useRemoveVillageAdmin(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => removeVillageAdminAction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['village-stats', id] }),
  });
}

export function useSwitchVillage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (villageId: string) => switchVillageAction(villageId),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
