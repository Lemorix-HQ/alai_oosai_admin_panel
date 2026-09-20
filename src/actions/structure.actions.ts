'use server';

import { deleteRequest, getRequest, patchRequest, postRequest } from '@/services/api';
import type {
  Anbiyam,
  Mandalam,
  NextSerial,
  StructureTree,
  Substation,
} from '@/src/types';

export interface StructureQuery {
  q?: string;
  mandalam_id?: string;
  status?: string;
  with_counts?: string;
}

export async function getStructureTreeAction() {
  return getRequest<undefined, StructureTree>('/structure');
}

// ---------------------------------------------------------------- Mandalams

export async function listMandalamsAction(query: StructureQuery = {}) {
  return getRequest<StructureQuery, Mandalam[]>('/mandalams', query);
}

export interface MandalamPayload {
  name: string;
  code: string;
  name_ta?: string;
  patron_saint?: string;
  substation_id?: string;
  sequence?: number;
}

export async function createMandalamAction(payload: MandalamPayload) {
  return postRequest<MandalamPayload, Mandalam>('/mandalams', payload);
}

export async function updateMandalamAction(id: string, payload: Partial<MandalamPayload>) {
  return patchRequest<Partial<MandalamPayload>, Mandalam>(`/mandalams/${id}`, payload);
}

export async function deactivateMandalamAction(id: string) {
  return deleteRequest<Mandalam>(`/mandalams/${id}`);
}

// ----------------------------------------------------------------- Anbiyams

export async function listAnbiyamsAction(query: StructureQuery = {}) {
  return getRequest<StructureQuery, Anbiyam[]>('/anbiyams', query);
}

export async function getAnbiyamAction(id: string) {
  return getRequest<undefined, Anbiyam & { family_count: number }>(`/anbiyams/${id}`);
}

/**
 * The lowest FREE serial in the Anbiyam.
 *
 * Resolved server-side on purpose: a departing family releases its slot, so it
 * is not max + 1, and two admins filling a form at the same time would
 * otherwise be shown the same number.
 */
export async function getNextSerialAction(anbiyamId: string) {
  return getRequest<undefined, NextSerial>(`/anbiyams/${anbiyamId}/next-serial`);
}

export interface AnbiyamPayload {
  code: string;
  name?: string;
  name_ta?: string;
  mandalam_id?: string;
  substation_id?: string;
  patron_saint?: string;
  meeting_day?: string;
  meeting_place?: string;
  sequence?: number;
}

export async function createAnbiyamAction(payload: AnbiyamPayload) {
  return postRequest<AnbiyamPayload, Anbiyam>('/anbiyams', payload);
}

export async function updateAnbiyamAction(id: string, payload: Partial<AnbiyamPayload>) {
  return patchRequest<Partial<AnbiyamPayload>, Anbiyam>(`/anbiyams/${id}`, payload);
}

export async function deactivateAnbiyamAction(id: string) {
  return deleteRequest<Anbiyam>(`/anbiyams/${id}`);
}

// --------------------------------------------------------------- Substations

export interface SubstationPayload {
  name: string;
  code: string;
  name_ta?: string;
  patron_saint?: string;
}

export async function listSubstationsAction() {
  return getRequest<undefined, Substation[]>('/substations');
}

export async function createSubstationAction(payload: SubstationPayload) {
  return postRequest<SubstationPayload, Substation>('/substations', payload);
}

export async function updateSubstationAction(id: string, payload: Partial<SubstationPayload>) {
  return patchRequest<Partial<SubstationPayload>, Substation>(`/substations/${id}`, payload);
}
