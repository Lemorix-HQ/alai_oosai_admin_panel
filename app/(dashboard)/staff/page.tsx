"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import FilterBar from "@/components/ui/FilterBar";
import ResourceTable, { type Column } from "@/components/ui/ResourceTable";
import StatusPill from "@/components/ui/StatusPill";
import SlideOver from "@/components/ui/SlideOver";
import { Field, FormActions, Select, TamilTextInput, TextInput } from "@/components/ui/Field";
import LanguageToggle from "@/components/ui/LanguageToggle";
import { PermissionGate } from "@/src/session/PermissionGate";
import { P } from "@/src/session/permissions";
import { useCreateStaff, useRoles, useStaff } from "@/hooks/useAccess";
import type { Role, RoleAssignment, StaffUser } from "@/src/types";

function activeRoles(assignments: RoleAssignment[] = []) {
  const names = assignments
    .filter((a) => a.status === "active")
    .map((a) => (typeof a.role_id === "string" ? a.role_id : a.role_id.name));
  return names.length ? names.join(", ") : "No role";
}

function NewStaffForm({ onDone }: { onDone: () => void }) {
  const create = useCreateStaff();
  const { data: rolesRes } = useRoles();
  const roles = ((rolesRes?.data ?? []) as Role[]).filter(
    (r) => r.status === "active" && r.key !== "super_admin",
  );

  const [v, setV] = useState({ name: "", phone: "", email: "", role_id: "" });
  const [error, setError] = useState<string | null>(null);
  // One name field, either language — so the form carries the toggle rather
  // than the field deciding for itself.
  const [tamilMode, setTamilMode] = useState(true);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!v.name.trim() || !v.phone.trim()) return setError("Name and phone are both required.");

    const res = await create.mutateAsync({
      name: v.name.trim(),
      phone: v.phone.trim(),
      email: v.email.trim() || undefined,
      role_ids: v.role_id ? [v.role_id] : [],
    });
    if (!res.success) setError(res.message);
    else onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <LanguageToggle tamilMode={tamilMode} onToggle={() => setTamilMode(!tamilMode)} />
      <Field label="Name" required>
        <TamilTextInput
          tamilMode={tamilMode}
          value={v.name}
          onChange={(e) => setV({ ...v, name: e.target.value })}
        />
      </Field>
      <Field label="Phone" required hint="This is the number they log in with. One phone, one person.">
        <TextInput value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />
      </Field>
      <Field label="Email">
        <TextInput type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
      </Field>
      <Field
        label="Role"
        hint="An account with no role can sign in and do nothing. More roles, and narrower scopes, are granted from their page."
      >
        <Select value={v.role_id} onChange={(e) => setV({ ...v, role_id: e.target.value })}>
          <option value="">No role yet</option>
          {roles.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </Select>
      </Field>
      <FormActions
        submitting={create.isPending}
        submitLabel="Create account"
        error={error}
        onCancel={onDone}
      />
    </form>
  );
}

function StaffList() {
  const params = useSearchParams();
  const { data, isLoading } = useStaff({ q: params.get("q") ?? undefined });
  const staff = (data?.data ?? []) as StaffUser[];

  const columns: Column<StaffUser>[] = [
    { key: "name", header: "Name", render: (u) => u.name },
    { key: "phone", header: "Phone", render: (u) => u.phone ?? "—" },
    { key: "roles", header: "Roles", render: (u) => activeRoles(u.assignments) },
    {
      key: "scope",
      header: "Scope",
      secondary: true,
      render: (u) => {
        const a = (u.assignments ?? []).filter((x) => x.status === "active");
        const narrowed = a.some(
          (x) => x.scope_mandalam_ids?.length || x.scope_anbiyam_ids?.length,
        );
        return narrowed ? "Narrowed" : a.length ? "Parish-wide" : "—";
      },
    },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <StatusPill
          label={u.status.replace("_", " ")}
          tone={u.status === "active" ? "success" : u.status === "not_registered" ? "warning" : "neutral"}
        />
      ),
    },
  ];

  return (
    <>
      <FilterBar searchPlaceholder="Search by name or phone…" />
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading staff…</p>
      ) : (
        <ResourceTable
          rows={staff}
          columns={columns}
          rowHref={(u) => `/staff/${u._id}`}
          empty={{
            icon: "badge",
            title: "No staff accounts",
            description: "Add the assistants, faculty and Anbiyam heads who will be using this system.",
          }}
        />
      )}
    </>
  );
}

export default function StaffPage() {
  const [open, setOpen] = useState(false);

  return (
    <PageShell
      title="Staff"
      subtitle="Who works in the parish, and what each of them may do."
      action={
        <PermissionGate permission={P.access.userManage}>
          <button
            onClick={() => setOpen(true)}
            className="font-bold py-2.5 px-5 rounded-lg inline-flex items-center gap-2 shadow-sm"
            style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New staff account
          </button>
        </PermissionGate>
      }
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <StaffList />
      </Suspense>

      <SlideOver
        open={open}
        title="New staff account"
        description="They log in with their phone and an OTP. The account exists as soon as you save it; it becomes active on their first login."
        onClose={() => setOpen(false)}
      >
        <NewStaffForm onDone={() => setOpen(false)} />
      </SlideOver>
    </PageShell>
  );
}
