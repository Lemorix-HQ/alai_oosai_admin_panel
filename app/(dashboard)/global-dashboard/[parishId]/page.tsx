"use client";

import Link from "next/link";
import { use, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import StatCard from "@/components/ui/StatCard";
import StatusPill from "@/components/ui/StatusPill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { FormCard } from "@/components/ui/Field";
import { useDeleteParish, useParishStats, useSwitchParish } from "@/hooks/useParishes";
import { useRouter } from "next/navigation";

export default function ParishDetailPage({
  params,
}: {
  params: Promise<{ parishId: string }>;
}) {
  const { parishId } = use(params);
  const router = useRouter();
  const { data: statsRes, isLoading } = useParishStats(parishId);
  const deleteParish = useDeleteParish();
  const switchParish = useSwitchParish();
  const [error, setError] = useState<string | null>(null);

  const stats = statsRes?.data;
  const parish = stats?.parish;

  if (isLoading) {
    return (
      <PageShell title="Parish">
        <p className="text-sm text-slate-500">Loading…</p>
      </PageShell>
    );
  }

  if (!parish) {
    return (
      <PageShell title="Parish" breadcrumb={[{ href: "/global-dashboard", label: "All parishes" }]}>
        <p className="text-sm text-slate-500">{statsRes?.message ?? "Parish not found."}</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={parish.name}
      subtitle={[parish.code, parish.diocese].filter(Boolean).join(" · ")}
      breadcrumb={[{ href: "/global-dashboard", label: "All parishes" }, { label: parish.name }]}
      action={
        <div className="flex flex-wrap gap-2">
          <button
            onClick={async () => {
              // Working "inside" a parish means holding its tenant on the token;
              // every scoped endpoint reads parish_id from there, not from the URL.
              const res = await switchParish.mutateAsync(parishId);
              if (res.success) router.push("/");
              else setError(res.message);
            }}
            className="font-bold py-2.5 px-5 rounded-lg inline-flex items-center gap-2 shadow-sm"
            style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
            Work in this parish
          </button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Families" value={stats.familyCount.toLocaleString()} icon="home" />
        <StatCard label="Members" value={stats.memberCount.toLocaleString()} icon="groups" />
        <StatCard label="Mandalams" value={stats.mandalamCount} icon="account_tree" />
        <StatCard label="Anbiyams" value={stats.anbiyamCount} icon="hub" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <FormCard
            title="Census backlog"
            description="What the parish still has to work through. Both are expected to be high on a freshly seeded parish."
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg p-4" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-2xl font-black" style={{ color: "#9a3412" }}>
                  {stats.unverifiedCount.toLocaleString()}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Families not yet verified at the door
                </p>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: "#eff6ff" }}>
                <p className="text-2xl font-black" style={{ color: "#1e40af" }}>
                  {stats.incompleteCount.toLocaleString()}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Families whose member list is incomplete
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              A seeded family carries only its head and spouse. Until a visit fills in the rest,
              an incomplete family is indistinguishable from a small one by count alone — which is
              why completeness is recorded rather than inferred.
            </p>
          </FormCard>

          <FormCard title="Accounts and content">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              {[
                { label: "Staff", value: stats.staffCount, href: `/parishes/${parishId}/staff` },
                { label: "Parishioners", value: stats.parishionerCount },
                { label: "Legacy cards", value: stats.legacyCardCount },
                { label: "Announcements", value: stats.announcementCount },
                { label: "Events", value: stats.eventCount },
                { label: "Reports", value: stats.reportCount },
              ].map((s) => {
                const body = (
                  <div className="rounded-lg py-3" style={{ backgroundColor: "#f8fafc" }}>
                    <p className="font-black" style={{ color: "#0D5C63" }}>
                      {s.value.toLocaleString()}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      {s.label}
                    </p>
                  </div>
                );
                return s.href ? (
                  <Link key={s.label} href={s.href}>{body}</Link>
                ) : (
                  <div key={s.label}>{body}</div>
                );
              })}
            </div>
          </FormCard>
        </div>

        <div className="space-y-4">
          <FormCard title="Parish priest">
            {stats.parishAdmin ? (
              <div>
                <p className="font-bold" style={{ color: "#0D5C63" }}>{stats.parishAdmin.name}</p>
                <p className="text-sm text-slate-500">{stats.parishAdmin.phone ?? "No phone"}</p>
                <div className="mt-2">
                  <StatusPill
                    label={stats.parishAdmin.status === "active" ? "Registered" : "Awaiting first login"}
                    tone={stats.parishAdmin.status === "active" ? "success" : "warning"}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                None assigned. Nobody here can approve a change request yet.
              </p>
            )}
            <Link href={`/parishes/${parishId}/staff`} className="text-sm font-bold" style={{ color: "#0D5C63" }}>
              Manage staff →
            </Link>
          </FormCard>

          <FormCard title="Manage">
            <div className="flex flex-col gap-2 text-sm font-bold" style={{ color: "#0D5C63" }}>
              <Link href={`/parishes/${parishId}/edit`}>Edit parish details →</Link>
              <Link href={`/parishes/${parishId}/settings`}>Pastoral settings →</Link>
              <Link href={`/system/audit?parish_id=${parishId}`}>Audit log →</Link>
            </div>
          </FormCard>

          <FormCard title="Danger zone">
            <p className="text-xs text-slate-500">
              A parish can only be deleted while nothing references it. With {stats.familyCount}{" "}
              families it will refuse, and say so.
            </p>
            <ConfirmDialog
              trigger={
                <button className="text-sm font-bold" style={{ color: "#dc2626" }}>
                  Delete this parish
                </button>
              }
              title={`Delete ${parish.name}?`}
              message="This cannot be undone. Type the parish code to confirm."
              confirmLabel="Delete parish"
              requireTyping={parish.code}
              onConfirm={async () => {
                const res = await deleteParish.mutateAsync(parishId);
                if (!res.success) setError(res.message);
                else router.push("/global-dashboard");
              }}
            />
          </FormCard>
        </div>
      </div>
    </PageShell>
  );
}
