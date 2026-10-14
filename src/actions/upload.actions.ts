'use server';

import { postRequest } from '@/services/api';

/**
 * A File that crossed the server-action boundary is not usable by fetch as it
 * stands — createEventAction rebuilds its files as Blobs for the same reason.
 * Rebuilding here keeps that knowledge in one place for the photo routes.
 */
async function reform(formData: FormData): Promise<FormData> {
  const out = new FormData();
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const buf = await value.arrayBuffer();
      out.append(key, new Blob([buf], { type: value.type }), value.name);
    } else {
      out.append(key, value);
    }
  }
  return out;
}

export async function uploadParishLogoAction(formData: FormData) {
  return postRequest<FormData, { url: string }>('/upload/parish/logo', await reform(formData));
}

export async function uploadMemberPhotoAction(formData: FormData) {
  return postRequest<FormData, { url: string }>('/upload/member/photo', await reform(formData));
}

/** Writes the signed-in account's own photo. It takes no id by design. */
export async function uploadStaffPhotoAction(formData: FormData) {
  return postRequest<FormData, { url: string }>('/upload/staff/photo', await reform(formData));
}
