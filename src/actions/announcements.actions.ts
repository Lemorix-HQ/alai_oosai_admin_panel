'use server';
import { getRequest, postRequest } from '@/services/api';
import { Announcement } from '@/types';

// GET /announcements/admin  — list all announcements for this parish
export async function getAdminAnnouncementsAction(params?: { page?: string; limit?: string }) {
  return getRequest<typeof params, Announcement[]>('/announcements/admin', params);
}

// File payloads are passed as Uint8Array + metadata to avoid Next.js multipart
// serialization issues (fetchServerAction sends FormData as multipart to the
// Next.js server, and Blob/File data can cause "Unexpected end of form" at that
// layer before this function runs). Uint8Array is serialized via the RSC binary
// protocol, bypassing multipart entirely.
type FilePayload = { data: Uint8Array; name: string; type: string };

export type CreateAnnouncementPayload = {
  title: string;
  description: string;
  time: string;
  image?: FilePayload;
  video?: FilePayload;
  voiceNote?: FilePayload;
};

/**
 * Copies a Uint8Array (which may back a SharedArrayBuffer) into a plain
 * ArrayBuffer so it is accepted as a valid BlobPart by TypeScript ≥ 5.2.
 */
function toArrayBuffer(uint8: Uint8Array): ArrayBuffer {
  return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
}

// POST /announcements  — multipart: title, description, time?, image?, video?, voiceNote?
export async function createAnnouncementAction(payload: CreateAnnouncementPayload) {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description);
  formData.append('time', payload.time);

  if (payload.image) {
    formData.append(
      'image',
      new Blob([toArrayBuffer(payload.image.data)], { type: payload.image.type }),
      payload.image.name,
    );
  }
  if (payload.video) {
    formData.append(
      'video',
      new Blob([toArrayBuffer(payload.video.data)], { type: payload.video.type }),
      payload.video.name,
    );
  }
  if (payload.voiceNote) {
    formData.append(
      'voiceNote',
      new Blob([toArrayBuffer(payload.voiceNote.data)], { type: payload.voiceNote.type }),
      payload.voiceNote.name,
    );
  }

  return postRequest<FormData, { id: string }>('/announcements', formData);
}

// NOTE: The backend announcement controller has NO GET /:id, PATCH /:id, or DELETE /:id routes.
// Individual announcement update and delete are not supported by the backend at this time.