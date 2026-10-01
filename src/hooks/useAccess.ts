'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignRoleAction,
  createRoleAction,
  createStaffAction,
  deactivateRoleAction,
  getPermissionCatalogueAction,
  getStaffAction,
  listAuditAction,
  listRolesAction,
  listStaffAction,
  revokeAssignmentAction,
  updateRoleAction,
  type AssignRolePayload,
  type AuditQuery,
  type CreateStaffPayload,
  type RolePayload,
  type StaffQuery,
} from '@/actions/access.actions';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => listRolesAction(),
    staleTime: 60 * 1000,
  });
}

export function usePermissionCatalogue() {
  return useQuery({
    queryKey: ['permission-catalogue'],
    queryFn: () => getPermissionCatalogueAction(),
    // The catalogue is a constant in the backend; only `grantable` varies, and
    // that changes with the signed-in user, not over time.
    staleTime: 30 * 60 * 1000,
  });
}

export function useStaff(query: StaffQuery = {}) {
  return useQuery({
    queryKey: ['staff', query],
    queryFn: () => listStaffAction(query),
    staleTime: 30 * 1000,
  });
}

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: ['staff-member', id],
    queryFn: () => getStaffAction(id),
    enabled: !!id,
  });
}

export function useAudit(query: AuditQuery = {}) {
  return useQuery({
    queryKey: ['audit', query],
    queryFn: () => listAuditAction(query),
    staleTime: 15 * 1000,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RolePayload) => createRoleAction(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<RolePayload> }) =>
      updateRoleAction(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      // Someone's effective permissions may have just changed.
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['staff-member'] });
    },
  });
}

export function useDeactivateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateRoleAction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => createStaffAction(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignRolePayload) => assignRoleAction(payload),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['staff-member', vars.user_id] });
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useRevokeAssignment(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => revokeAssignmentAction(assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      if (userId) qc.invalidateQueries({ queryKey: ['staff-member', userId] });
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}
