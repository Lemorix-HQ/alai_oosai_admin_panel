'use server';
import { getRequest, postRequest, patchRequest, deleteRequest } from '@/services/api';
import { Event } from '@/types';

export async function getAdminEventsAction(params?: {
  page?: string;
  limit?: string;
  type?: string;
  search?: string;
}) {
  return getRequest<typeof params, Event[]>('/events/admin', params);
}

export async function getEventAction(id: string) {
  return getRequest<undefined, Event>(`/events/${id}`);
}

export async function createEventAction(formData: FormData) {
  return postRequest<FormData, { id: string }>('/events', formData);
}

// PATCH /events/:id does NOT have a FileInterceptor — JSON body only.
// Image replacement is not supported by the backend on update.
export type UpdateEventPayload = {
  title?: string;
  description?: string;
  place?: string;
  time?: string;
  conductorName?: string;
  type?: string;
  tags?: string[];
  ctaText?: string;
};

export async function updateEventAction(id: string, data: UpdateEventPayload) {
  return patchRequest<UpdateEventPayload, Event>(`/events/${id}`, data);
}

export async function deleteEventAction(id: string) {
  return deleteRequest<null>(`/events/${id}`);
}
