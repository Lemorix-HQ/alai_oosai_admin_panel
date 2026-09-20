"use client";

import Link from "next/link";
import { use, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import ResourceTable, { type Column } from "@/components/ui/ResourceTable";
import StatusPill from "@/components/ui/StatusPill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Field, FormActions, FormCard, TextInput } from "@/components/ui/Field";
import { useAssignParishAdmin, useParishStats, useRemoveParishAdmin } from "@/hooks/useParishes";
import { useStaff } from "@/hooks/useAccess";
import type { RoleAssignment, StaffUser } from "@/src/types";

function roleNames(assignments: RoleAssignment[]) {
  const names = assignments
    .filter((a) => a.status === "active")
    .map((a) => (typeof a.role_id === "string" ? a.role_id : a.role_id.name));
  return names.length ? names.join(", ") : "No role";
}

export default function ParishStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: statsRes } = useParishStats(id);
  const { data: staffRes, isLoading } = useStaff({ parish_id: id, account_type: "parish_staff" });
  const assign = useAssignParishAdmin(id);
  const remove = useRemoveParishAdmin(id);

  const [form, setForm] = useState({ name: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const stats = statsRes?.data;
  const priest = stats?.parishAdmin ?? null;
  const staff = (staffRes?.data ?? []) as StaffUser[];

  const columns: Column<StaffUser>[] = [
    { key: "name", header: "Name", render: (u) => u.name },
    { key: "phone", header: "Phone", render: (u) => u.phone ?? "—" },
    { key: "roles", header: "Roles", render: (u) => roleNames(u.assignments ?? []) },
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone are both required.");
      return;
    }
    const res = await assign.mutateAsync({ name: form.name.trim(), phone: form.phone.trim() });
    if (!res.success) setError(res.message);
    else {
      setNotice(`${form.name.trim()} now holds the parish priest role.`);
      setForm({ name: "", phone: "" });
    }
  }

  return (
    <PageShell
      title="Parish staff"
      subtitle={stats?.parish?.name}
      breadcrumb={[
        { href: "/parishes", label: "Parishes" },
        { href: `/global-dashboard/${id}`, label: stats?.parish?.name ?? "Parish" },
        { label: "Staff" },
      ]}
    >
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <FormCard
            title="Parish priest"
            description="One priest per parish. Installing a new one revokes the previous assignment; the account itself is kept."
          >
            {priest ? (
              <div className="space-y-3">
                <div>
                  <p className="font-bold" style={{ color: "#0D5C63" }}>{priest.name}</p>
                  <p className="text-sm text-slate-500">{priest.phone ?? "No phone"}</p>
                  <div className="mt-2">
                    <StatusPill
                      label={priest.status === "active" ? "Registered" : "Awaiting first login"}
                      tone={priest.status === "active" ? "success" : "warning"}
                    />
                  </div>
                </div>
                <ConfirmDialog
                  trigger={
                    <button className="text-sm font-bold" style={{ color: "#dc2626" }}>
                      Revoke priest role
                    </button>
                  }
                  title="Revoke the parish priest role?"
                  message="The account stays and keeps its history. Until another priest is installed, nobody in this parish can approve change requests."
                  confirmLabel="Revoke"
                  onConfirm={async () => {
                    const res = await remove.mutateAsync();
                    if (!res.success) setError(res.message);
                    else setNotice("Priest role revoked.");
                  }}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No priest assigned. Nobody in this parish can approve a change request yet.
              </p>
            )}
          </FormCard>

          <form onSubmit={submit}>
            <FormCard title={priest ? "Replace the priest" : "Assign a priest"}>
              <Field label="Name" required>
                <TextInput
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>
              <Field label="Phone" required hint="This is the number he logs in with.">
                <TextInput
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </Field>
              {notice && (
                <div className="px-3 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: "#d1fae5", color: "#065f46" }}>
                  {notice}
                </div>
              )}
              <FormActions
                submitting={assign.isPending}
                submitLabel={priest ? "Replace priest" : "Assign priest"}
                error={error}
              />
            </FormCard>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold" style={{ color: "#0D5C63" }}>
              All staff accounts ({staff.length})
            </h2>
            <Link href="/system/users" className="text-xs font-bold" style={{ color: "#0D5C63" }}>
              All users →
            </Link>
          </div>
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading staff…</p>
          ) : (
            <ResourceTable
              rows={staff}
              columns={columns}
              rowHref={(u) => `/system/users/${u._id}`}
              empty={{
                icon: "badge",
                title: "No staff accounts",
                description: "Assign a priest above; he can then add assistants, faculty and Anbiyam heads himself.",
              }}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
