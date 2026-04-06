'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminEventsAction,
  getEventAction,
  createEventAction,
  updateEventAction,
  deleteEventAction,
  type UpdateEventPayload,
} from '@/src/actions/events.actions';

export function useAdminEvents(params?: {
  page?: string;
  limit?: string;
  type?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['admin-events', params],
    queryFn: () => getAdminEventsAction(params),
    staleTime: 60 * 1000,
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventAction(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createEventAction(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-events'] }),
  });
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateEventPayload) => updateEventAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEventAction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-events'] }),
  });
}
