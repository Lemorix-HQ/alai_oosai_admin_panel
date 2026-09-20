"use client";

import Link from "next/link";
import { useState } from "react";
import PageShell from "@/components/ui/PageShell";
import ResourceTable, { type Column } from "@/components/ui/ResourceTable";
import StatusPill from "@/components/ui/StatusPill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useDeactivateRole, useRoles } from "@/hooks/useAccess";
import type { Role } from "@/src/types";

export default function RolesPage() {
  const { data, isLoading } = useRoles();
  const deactivate = useDeactivateRole();
  const [error, setError] = useState<string | null>(null);

  const roles = (data?.data ?? []) as Role[];

  const columns: Column<Role>[] = [
    {
      key: "name",
      header: "Role",
      render: (r) => (
        <span>
          {r.name}
          <span className="block text-xs font-mono text-slate-400">{r.key}</span>
        </span>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      render: (r) =>
        r.is_immutable ? (
          <StatusPill label="System" tone="warning" icon="lock" />
        ) : r.is_template ? (
          <StatusPill label="Template" tone="info" />
        ) : (
          <StatusPill label="Parish" tone="neutral" />
        ),
    },
    { key: "permissions", header: "Permissions", render: (r) => r.permissions.length },
    { key: "scope_level", header: "Scope", secondary: true, render: (r) => r.scope_level },
    { key: "assigned_count", header: "Held by", render: (r) => r.assigned_count ?? 0 },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusPill label={r.status} tone={r.status === "active" ? "success" : "neutral"} />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <span className="flex justify-end gap-2 whitespace-nowrap">
          <Link href={`/roles/${r._id}`} className="text-xs font-bold" style={{ color: "#0D5C63" }}>
            {r.is_immutable ? "View" : "Edit"}
          </Link>
          {!r.is_immutable && r.status === "active" && (
            <ConfirmDialog
              trigger={<button className="text-xs font-bold" style={{ color: "#dc2626" }}>Deactivate</button>}
              title={`Deactivate ${r.name}?`}
              message="A role still held by someone cannot be deactivated — revoke those assignments first. The role is kept, not deleted, so past assignments stay readable."
              confirmLabel="Deactivate"
              onConfirm={async () => {
                const res = await deactivate.mutateAsync(r._id);
                if (!res.success) setError(res.message);
              }}
            />
          )}
        </span>
      ),
    },
  ];

  return (
    <PageShell
      title="Roles"
      subtitle="A role is a named set of permissions. You can only put into one what you hold yourself."
      action={{ href: "/roles/new", label: "New role" }}
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
          {error}
        </div>
      )}
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading roles…</p>
      ) : (
        <ResourceTable
          rows={roles}
          columns={columns}
          rowHref={(r) => `/roles/${r._id}`}
          empty={{ icon: "shield_person", title: "No roles", description: "Seed the system roles, or create one from a template." }}
        />
      )}
    </PageShell>
  );
}
