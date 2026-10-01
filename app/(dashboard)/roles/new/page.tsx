"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PageShell from "@/components/ui/PageShell";
import RoleForm from "@/components/access/RoleForm";
import { useCreateRole, useRoles } from "@/hooks/useAccess";
import type { Role } from "@/src/types";

function NewRole() {
  const params = useSearchParams();
  const copyFrom = params.get("from");
  const createRole = useCreateRole();
  const { data } = useRoles();

  // Copying a template is the normal way to make a role: start from faculty or
  // anbiyam_head and narrow it, rather than picking 41 permissions from scratch.
  const template = copyFrom
    ? ((data?.data ?? []) as Role[]).find((r) => r._id === copyFrom)
    : undefined;

  return (
    <RoleForm
      initial={
        template
          ? {
              name: `${template.name} (copy)`,
              permissions: template.permissions,
              scope_level: template.scope_level,
              description: template.description,
            }
          : undefined
      }
      submitLabel="Create role"
      cancelHref="/roles"
      onSubmit={(payload) =>
        createRole.mutateAsync(
          template ? { ...payload, derived_from_role_id: template._id } : payload,
        )
      }
    />
  );
}

export default function NewRolePage() {
  return (
    <PageShell
      title="New role"
      subtitle="Copy a template and narrow it, or build one from scratch."
      breadcrumb={[{ href: "/roles", label: "Roles" }, { label: "New" }]}
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <NewRole />
      </Suspense>
    </PageShell>
  );
}
