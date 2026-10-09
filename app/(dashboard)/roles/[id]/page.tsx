"use client";

import Link from "next/link";
import { use } from "react";
import PageShell from "@/components/ui/PageShell";
import RoleForm from "@/components/access/RoleForm";
import { FormCard } from "@/components/ui/Field";
import { useRoles, useUpdateRole } from "@/hooks/useAccess";
import { useSession } from "@/src/session/SessionProvider";
import type { Role } from "@/src/types";

export default function RolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useRoles();
  const { user } = useSession();
  const updateRole = useUpdateRole();

  const role = ((data?.data ?? []) as Role[]).find((r) => r._id === id);

  // Read-only for two different reasons, and the second was missing. A system
  // role is frozen for everybody. A role with NO parish is shared by every
  // parish — the three templates — and belongs to the super admin; opening one
  // used to show this parish priest an edit form over everyone else's data.
  const isSuperAdmin = user?.account_type === "super_admin";
  const sharedTemplate = Boolean(role && !role.parish_id && !isSuperAdmin);
  const readOnly = Boolean(role?.is_immutable) || sharedTemplate;

  return (
    <PageShell
      title={role?.name ?? "Role"}
      subtitle={role?.description}
      breadcrumb={[{ href: "/roles", label: "Roles" }, { label: role?.name ?? "Role" }]}
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !role ? (
        <p className="text-sm text-slate-500">Role not found.</p>
      ) : readOnly ? (
        <div className="space-y-4 max-w-3xl">
          <FormCard
            title={sharedTemplate ? "Shared template" : "System role"}
            description={
              sharedTemplate
                ? "Templates are shared by every parish, so only a super admin can change one. Copy it into your parish and remove what you will not delegate."
                : "System roles are fixed. To give someone a narrower version, copy this role and remove what they should not have."
            }
          >
            <div className="flex flex-wrap gap-1.5">
              {role.permissions.map((p) => (
                <span key={p} className="px-2 py-1 rounded text-[11px] font-mono" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                  {p}
                </span>
              ))}
            </div>
            <Link
              href={`/roles/new?from=${role._id}`}
              className="inline-flex items-center gap-2 font-bold py-2 px-4 rounded-lg text-sm"
              style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
              Copy and narrow
            </Link>
          </FormCard>
        </div>
      ) : (
        <RoleForm
          initial={role}
          submitLabel="Save role"
          cancelHref="/roles"
          onSubmit={(payload) => updateRole.mutateAsync({ id, payload })}
        />
      )}
    </PageShell>
  );
}
