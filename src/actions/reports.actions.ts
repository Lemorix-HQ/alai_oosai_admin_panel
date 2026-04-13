'use server';
import { getRequest, postRequest, patchRequest, deleteRequest } from '@/services/api';
import { Report } from '@/types';

// GET /reports/admin  — list all reports for this village
export async function getAdminReportsAction(params?: { page?: string; limit?: string }) {
  return getRequest<typeof params, Report[]>('/reports/admin', params);
}

// POST /reports  — multipart: title (required), description (required), pdf (file, required)
export async function createReportAction(formData: FormData) {
  const out = new FormData();
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const buf = await value.arrayBuffer();
      out.append(key, new Blob([buf], { type: value.type }), value.name);
    } else {
      out.append(key, value);
    }
  }
  return postRequest<FormData, { id: string }>('/reports', out);
}

// PATCH /reports/:id  — JSON body only: { title?, description? }
// pdfUrl is managed by the backend on create; the update endpoint accepts pdfUrl as a URL string
// but since there is no separate file-upload for updates, we only update text fields.
export type UpdateReportPayload = {
  title?: string;
  description?: string;
};

export async function updateReportAction(id: string, data: UpdateReportPayload) {
  return patchRequest<UpdateReportPayload, null>(`/reports/${id}`, data);
}

export async function deleteReportAction(id: string) {
  return deleteRequest<null>(`/reports/${id}`);
}

// NOTE: The backend report controller has NO GET /reports/:id route.
// To display a single report for editing, load from getAdminReportsAction and filter by id.
