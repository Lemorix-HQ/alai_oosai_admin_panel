'use server';
import { getRequest, postRequest } from '@/services/api';
import { Announcement } from '@/types';

// GET /announcements/admin  — list all announcements for this village
export async function getAdminAnnouncementsAction(params?: { page?: string; limit?: string }) {
  return getRequest<typeof params, Announcement[]>('/announcements/admin', params);
}

// POST /announcements  — multipart: title, description, time?, image?, video?, voiceNote?
export async function createAnnouncementAction(formData: FormData) {
  return postRequest<FormData, { id: string }>('/announcements', formData);
}

// NOTE: The backend announcement controller has NO GET /:id, PATCH /:id, or DELETE /:id routes.
// Individual announcement update and delete are not supported by the backend at this time.
