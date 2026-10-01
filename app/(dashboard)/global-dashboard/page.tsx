"use client";

import Link from "next/link";
import PageShell from "@/components/ui/PageShell";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import StatusPill from "@/components/ui/StatusPill";
import { useParishes } from "@/hooks/useParishes";
import type { ParishWithCounts } from "@/src/types";

/**
 * The super admin's landing page: every parish at a glance.
 *
 * The route guard lives in proxy.ts and the sidebar hides it for anyone who is
 * not a super admin, but the numbers come from endpoints that check for
 * themselves — this page showing something is never what grants access to it.
 */
export default function GlobalDashboardPage() {
  const { data, isLoading } = useParishes();
  const parishes = (data?.data ?? []) as ParishWithCounts[];

  const totals = parishes.reduce(
    (acc, p) => ({
      families: acc.families + (p.family_count ?? 0),
      members: acc.members + (p.member_count ?? 0),
      staff: acc.staff + (p.staff_count ?? 0),
    }),
    { families: 0, members: 0, staff: 0 },
  );

  return (
    <PageShell
      title="All parishes"
      subtitle="Every tenant on the platform. Open one to manage its priest, structure and families."
      action={{ href: "/parishes/new", label: "New parish" }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Parishes" value={parishes.length} icon="church" href="/parishes" />
        <StatCard label="Families" value={totals.families.toLocaleString()} icon="home" />
        <StatCard label="Members" value={totals.members.toLocaleString()} icon="groups" />
        <StatCard label="Staff accounts" value={totals.staff} icon="badge" href="/system/users" />
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading parishes…</p>
      ) : parishes.length === 0 ? (
        <div className="bg-white rounded-xl border" style={{ borderColor: "#e2e8f0" }}>
          <EmptyState
            icon="church"
            title="No parishes yet"
            description="Create the first parish, then assign its priest."
            action={{ href: "/parishes/new", label: "New parish" }}
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parishes.map((p) => (
            <Link
              key={p._id}
              href={`/global-dashboard/${p._id}`}
              className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow"
              style={{ borderColor: "#e2e8f0" }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="font-bold truncate" style={{ color: "#0D5C63" }}>
                    {p.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">{p.code}</p>
                </div>
                <StatusPill
                  label={p.status ?? "active"}
                  tone={p.status === "inactive" ? "neutral" : "success"}
                />
              </div>
              {p.diocese && <p className="text-xs text-slate-500 mb-3">{p.diocese}</p>}
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Families", value: p.family_count ?? 0 },
                  { label: "Members", value: p.member_count ?? 0 },
                  { label: "Staff", value: p.staff_count ?? 0 },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg py-2" style={{ backgroundColor: "#f8fafc" }}>
                    <dd className="font-black" style={{ color: "#0D5C63" }}>
                      {s.value.toLocaleString()}
                    </dd>
                    <dt className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      {s.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
