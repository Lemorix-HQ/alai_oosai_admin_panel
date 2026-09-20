'use server';

import { deleteRequest, getRequest, postRequest, patchRequest } from '@/services/api';
import type {
  AuditEntry,
  Paged,
  PermissionCatalogue,
  Role,
  RoleAssignment,
  StaffDetail,
  StaffUser,
} from '@/src/types';

// ---------------------------------------------------------------------- roles

export async function listRolesAction() {
  return getRequest<undefined, Role[]>('/roles');
}

/**
 * The permission vocabulary, each key flagged with whether the CURRENT user may
 * grant it. The role editor greys out the rest rather than letting someone
 * build a role the delegation rule will reject on save.
 */
export async function getPermissionCatalogueAction() {
  return getRequest<undefined, PermissionCatalogue>('/roles/catalogue');
}

export interface RolePayload {
  key: string;
  name: string;
  permissions: string[];
  name_ta?: string;
  description?: string;
  scope_level?: 'parish' | 'mandalam' | 'anbiyam';
  derived_from_role_id?: string;
}

export async function createRoleAction(payload: RolePayload) {
  return postRequest<RolePayload, Role>('/roles', payload);
}

export async function updateRoleAction(id: string, payload: Partial<RolePayload>) {
  return patchRequest<Partial<RolePayload>, Role>(`/roles/${id}`, payload);
}

export async function deactivateRoleAction(id: string) {
  return deleteRequest<Role>(`/roles/${id}`);
}

// ---------------------------------------------------------------------- staff

export interface StaffQuery {
  q?: string;
  account_type?: string;
  parish_id?: string;
  page?: string;
  limit?: string;
}

export async function listStaffAction(query: StaffQuery = {}) {
  return getRequest<StaffQuery, StaffUser[]>('/staff', query);
}

export async function getStaffAction(id: string) {
  return getRequest<undefined, StaffDetail>(`/staff/${id}`);
}

export interface CreateStaffPayload {
  name: string;
  phone: string;
  email?: string;
  /** A staff account with no roles can log in and do nothing. */
  role_ids?: string[];
}

export async function createStaffAction(payload: CreateStaffPayload) {
  return postRequest<CreateStaffPayload, StaffUser>('/staff', payload);
}

export interface AssignRolePayload {
  user_id: string;
  role_id: string;
  scope_mandalam_ids?: string[];
  scope_anbiyam_ids?: string[];
  valid_from?: string;
  valid_to?: string;
  note?: string;
}

export async function assignRoleAction(payload: AssignRolePayload) {
  return postRequest<AssignRolePayload, RoleAssignment>('/staff/assignments', payload);
}

export async function revokeAssignmentAction(assignmentId: string) {
  return deleteRequest<RoleAssignment>(`/staff/assignments/${assignmentId}`);
}

// ---------------------------------------------------------------------- audit

export interface AuditQuery {
  parish_id?: string;
  entity?: string;
  action?: string;
  actor_user_id?: string;
  page?: string;
  limit?: string;
}

export async function listAuditAction(query: AuditQuery = {}) {
  return getRequest<AuditQuery, Paged<AuditEntry>>('/audit', query);
}
