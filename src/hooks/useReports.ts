'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminReportsAction,
  createReportAction,
  updateReportAction,
  deleteReportAction,
  type UpdateReportPayload,
} from '@/src/actions/reports.actions';

// NOTE: The backend has no GET /reports/:id. Use getAdminReportsAction and filter by id.

export function useAdminReports(params?: { page?: string; limit?: string }) {
  return useQuery({
    queryKey: ['admin-reports', params],
    queryFn: () => getAdminReportsAction(params),
    staleTime: 60 * 1000,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createReportAction(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  });
}

export function useUpdateReport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateReportPayload) => updateReportAction(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReportAction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  });
}
