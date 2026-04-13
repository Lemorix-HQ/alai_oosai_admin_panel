'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminAnnouncementsAction,
  createAnnouncementAction,
  CreateAnnouncementPayload,
} from '@/src/actions/announcements.actions';

// NOTE: The backend has no GET /:id, PATCH /:id, or DELETE /:id for announcements.
// Only list and create are supported.
export function useAdminAnnouncements(params?: { page?: string; limit?: string }) {
  return useQuery({
    queryKey: ['admin-announcements', params],
    queryFn: () => getAdminAnnouncementsAction(params),
    staleTime: 60 * 1000,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) => createAnnouncementAction(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-announcements'] }),
  });
}