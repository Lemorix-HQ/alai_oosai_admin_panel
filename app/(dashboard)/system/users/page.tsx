"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PageShell from "@/components/ui/PageShell";
import FilterBar from "@/components/ui/FilterBar";
import ResourceTable, { type Column } from "@/components/ui/ResourceTable";
import StatusPill from "@/components/ui/StatusPill";
import { useStaff } from "@/hooks/useAccess";
import { useParishes } from "@/hooks/useParishes";
import type { ParishWithCounts, RoleAssignment, StaffUser } from "@/src/types";

const ACCOUNT_TONE: Record<string, "info" | "warning" | "neutral"> = {
  super_admin: "warning",
  parish_staff: "info",
  parishioner: "neutral",
};

function activeRoles(assignments: RoleAssignment[] = []) {
  const names = assignments
    .filter((a) => a.status === "active")
    .map((a) => (typeof a.role_id === "string" ? a.role_id : a.role_id.name));
  return names.length ? names.join(", ") : "—";
}

function UsersTable() {
  const params = useSearchParams();
  const query = {
    q: params.get("q") ?? undefined,
    account_type: params.get("account_type") ?? undefined,
    parish_id: params.get("parish_id") ?? undefined,
  };
  const { data, isLoading } = useStaff(query);
  const { data: parishRes } = useParishes();

  const users = (data?.data ?? []) as StaffUser[];
  const parishes = (parishRes?.data ?? []) as ParishWithCounts[];
  const parishName = new Map(parishes.map((p) => [p._id, p.name]));

  const columns: Column<StaffUser>[] = [
    { key: "name", header: "Name", render: (u) => u.name },
    { key: "phone", header: "Phone", render: (u) => u.phone ?? "—" },
    {
      key: "account_type",
      header: "Account",
      render: (u) => (
        <StatusPill label={u.account_type.replace("_", " ")} tone={ACCOUNT_TONE[u.account_type] ?? "neutral"} />
      ),
    },
    {
      key: "parish",
      header: "Parish",
      secondary: true,
      render: (u) => (u.parish_id ? (parishName.get(u.parish_id) ?? "—") : "All parishes"),
    },
    { key: "roles", header: "Roles", render: (u) => activeRoles(u.assignments) },
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
      <FilterBar
        searchPlaceholder="Search by name or phone…"
        filters={[
          {
            key: "account_type",
            label: "Account",
            options: [
              { value: "super_admin", label: "Super admin" },
              { value: "parish_staff", label: "Parish staff" },
              { value: "parishioner", label: "Parishioner" },
            ],
          },
          {
            key: "parish_id",
            label: "Parish",
            options: parishes.map((p) => ({ value: p._id, label: p.name })),
          },
        ]}
      />
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading users…</p>
      ) : (
        <ResourceTable
          rows={users}
          columns={columns}
          rowHref={(u) => `/system/users/${u._id}`}
          empty={{ icon: "manage_accounts", title: "No users match", description: "Try clearing the filters." }}
        />
      )}
    </>
  );
}

export default function SystemUsersPage() {
  return (
    <PageShell
      title="All users"
      subtitle="Every account on the platform, across parishes. Permissions come from roles, not from the account type."
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <UsersTable />
      </Suspense>
    </PageShell>
  );
}
