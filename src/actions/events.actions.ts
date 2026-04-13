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
  const out = new FormData();
  let tagCount = 0;
  let lastTag = '';

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const buf = await value.arrayBuffer();
      out.append(key, new Blob([buf], { type: value.type }), value.name);
    } else {
      out.append(key, value);
      if (key === 'tags') {
        tagCount++;
        lastTag = value as string;
      }
    }
  }

  // NestJS/multer parses a single same-name form field as a plain string, not an array,
  // which fails the backend's @IsArray() validation. Appending the tag a second time
  // forces multer to produce an array. The edit form deduplicates on load.
  if (tagCount === 1) {
    out.append('tags', lastTag);
  }

  return postRequest<FormData, { id: string }>('/events', out);
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
