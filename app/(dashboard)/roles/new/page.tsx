"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PageShell from "@/components/ui/PageShell";
import RoleForm from "@/components/access/RoleForm";
import { Field, FormCard, Select } from "@/components/ui/Field";
import { useCreateRole, useRoles } from "@/hooks/useAccess";
import type { Role } from "@/src/types";

function NewRole() {
  const params = useSearchParams();
  const router = useRouter();
  const copyFrom = params.get("from");
  const createRole = useCreateRole();
  const { data } = useRoles();

  const roles = (data?.data ?? []) as Role[];

  // Copying a template is the normal way to make a role: start from faculty or
  // anbiyam_head and narrow it, rather than picking 43 permissions from scratch.
  //
  // The prefill below has always worked; nothing led to it. The only link was
  // on the two IMMUTABLE system roles, and a template is not immutable — so
  // opening Faculty showed the edit form instead, and the three roles whose
  // whole purpose is to be copied were the three you could not copy. Hence the
  // picker.
  const templates = roles.filter((r) => r.is_template && r.status === "active");
  const template = copyFrom ? roles.find((r) => r._id === copyFrom) : undefined;

  function choose(id: string) {
    router.replace(id ? `/roles/new?from=${id}` : "/roles/new");
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <FormCard
        title="Start from a template"
        description="A template is a ready-made set of permissions to copy and cut down. Picking one fills the form in below; you can change anything afterwards, and the template itself is left alone."
      >
        <Field label="Template" hint="Leave this on “Start from scratch” to pick every permission yourself.">
          <Select value={template?._id ?? ""} onChange={(e) => choose(e.target.value)}>
            <option value="">Start from scratch</option>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} — {t.permissions.length} permissions
              </option>
            ))}
          </Select>
        </Field>
        {template && (
          <p className="text-xs" style={{ color: "#0D5C63" }}>
            Loaded <strong>{template.name}</strong> and its {template.permissions.length}{" "}
            permissions. The new role records that it came from this one.
          </p>
        )}
      </FormCard>

      <RoleForm
        // Remounts the form when the template changes. Its fields are seeded
        // from `initial` on first render only, so without this a second pick
        // would change the heading and nothing else.
        key={template?._id ?? "scratch"}
        initial={
          template
            ? {
                name: `${template.name} (copy)`,
                name_ta: template.name_ta,
                description: template.description,
                permissions: template.permissions,
                scope_anbiyam_ids: template.scope_anbiyam_ids,
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
    </div>
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
