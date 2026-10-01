"use client";

import Link from "next/link";
import { useState } from "react";
import PageShell from "@/components/ui/PageShell";
import ResourceTable, { type Column } from "@/components/ui/ResourceTable";
import StatCard from "@/components/ui/StatCard";
import StatusPill from "@/components/ui/StatusPill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useDeleteParish, useParishes } from "@/hooks/useParishes";
import type { ParishWithCounts } from "@/src/types";

export default function ParishesPage() {
  const { data, isLoading } = useParishes();
  const deleteParish = useDeleteParish();
  const [error, setError] = useState<string | null>(null);

  const parishes = (data?.data ?? []) as ParishWithCounts[];
  const totals = parishes.reduce(
    (acc, p) => ({
      families: acc.families + (p.family_count ?? 0),
      members: acc.members + (p.member_count ?? 0),
      staff: acc.staff + (p.staff_count ?? 0),
    }),
    { families: 0, members: 0, staff: 0 },
  );

  const columns: Column<ParishWithCounts>[] = [
    {
      key: "name",
      header: "Parish",
      render: (p) => (
        <span>
          {p.name}
          {p.name_ta && <span className="block text-xs text-slate-500">{p.name_ta}</span>}
        </span>
      ),
    },
    { key: "code", header: "Code", render: (p) => <span className="font-mono text-xs">{p.code}</span> },
    { key: "diocese", header: "Diocese", secondary: true, render: (p) => p.diocese ?? "—" },
    { key: "family_count", header: "Families", render: (p) => (p.family_count ?? 0).toLocaleString() },
    { key: "member_count", header: "Members", render: (p) => (p.member_count ?? 0).toLocaleString() },
    { key: "staff_count", header: "Staff", secondary: true, render: (p) => p.staff_count ?? 0 },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <StatusPill label={p.status ?? "active"} tone={p.status === "inactive" ? "neutral" : "success"} />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <span className="flex justify-end gap-2 whitespace-nowrap">
          <Link href={`/global-dashboard/${p._id}`} className="text-xs font-bold" style={{ color: "#0D5C63" }}>
            Open
          </Link>
          <Link href={`/parishes/${p._id}/edit`} className="text-xs font-bold" style={{ color: "#0D5C63" }}>
            Edit
          </Link>
          <Link href={`/parishes/${p._id}/staff`} className="text-xs font-bold" style={{ color: "#0D5C63" }}>
            Staff
          </Link>
          <ConfirmDialog
            trigger={<button className="text-xs font-bold" style={{ color: "#dc2626" }}>Delete</button>}
            title={`Delete ${p.name}?`}
            message="A parish can only be deleted while nothing references it. If it holds families, staff or announcements, the API will refuse and tell you what is in the way."
            confirmLabel="Delete parish"
            requireTyping={p.code}
            onConfirm={async () => {
              const res = await deleteParish.mutateAsync(p._id);
              if (!res.success) setError(res.message);
            }}
          />
        </span>
      ),
    },
  ];

  return (
    <PageShell
      title="Parishes"
      subtitle="Every tenant on the platform."
      action={{ href: "/parishes/new", label: "New parish" }}
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Parishes" value={parishes.length} icon="church" />
        <StatCard label="Families" value={totals.families.toLocaleString()} icon="home" />
        <StatCard label="Members" value={totals.members.toLocaleString()} icon="groups" />
        <StatCard label="Staff accounts" value={totals.staff} icon="badge" />
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading parishes…</p>
      ) : (
        <ResourceTable
          rows={parishes}
          columns={columns}
          rowHref={(p) => `/global-dashboard/${p._id}`}
          empty={{
            icon: "church",
            title: "No parishes yet",
            description: "Create the first parish to start seeding structure and families.",
            action: { href: "/parishes/new", label: "New parish" },
          }}
        />
      )}
    </PageShell>
  );
}
