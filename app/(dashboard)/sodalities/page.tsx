"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PageShell from "@/components/ui/PageShell";
import FilterBar from "@/components/ui/FilterBar";
import Pagination from "@/components/ui/Pagination";
import ResourceTable, { type Column } from "@/components/ui/ResourceTable";
import StatusPill from "@/components/ui/StatusPill";
import { PermissionGate } from "@/src/session/PermissionGate";
import { P } from "@/src/session/permissions";
import { useSodalities } from "@/hooks/useSodalities";
import type { Sodality } from "@/src/types";

function SodalitiesList() {
  const params = useSearchParams();
  const page = params.get("page") ?? "1";
  const status = params.get("status") ?? "active";

  const { data, isLoading } = useSodalities({
    q: params.get("q") ?? undefined,
    status,
    with_counts: "true",
    page,
  });

  const paged = data?.data;
  const rows = paged?.rows ?? [];

  const columns: Column<Sodality>[] = [
    { key: "name", header: "Name", render: (s) => <span className="font-semibold">{s.name}</span> },
    { key: "code", header: "Code", render: (s) => <span className="font-mono">{s.code}</span> },
    { key: "patron_saint", header: "Patron saint", secondary: true, render: (s) => s.patron_saint ?? "—" },
    {
      key: "members",
      header: "Members",
      render: (s) => <StatusPill label={String(s.member_count ?? 0)} tone="info" />,
    },
  ];

  if (status !== "active") {
    columns.push({
      key: "status",
      header: "Status",
      render: (s) => <StatusPill label={s.status} tone={s.status === "active" ? "success" : "neutral"} />,
    });
  }

  return (
    <>
      <FilterBar
        searchPlaceholder="Search by name, Tamil name or code…"
        filters={[
          {
            key: "status",
            label: "Status",
            unsetLabel: "Status: Active",
            options: [{ value: "all", label: "Active and retired" }],
          },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading sodalities…</p>
      ) : (
        <>
          <ResourceTable
            rows={rows}
            columns={columns}
            rowHref={(s) => `/sodalities/${s._id}`}
            empty={{
              icon: "diversity_3",
              title: "No sodalities match",
              description: "Clear the filters, or add the parish's first sodality.",
            }}
          />
          {paged && <Pagination page={paged.page} pages={paged.pages} total={paged.total} shown={rows.length} />}
        </>
      )}
    </>
  );
}

export default function SodalitiesPage() {
  return (
    <PageShell
      title="Sodalities"
      subtitle="Parish associations — Legion of Mary, Sacred Heart Sodality, and the rest."
      action={
        <PermissionGate permission={P.sodality.manage}>
          <Link
            href="/sodalities/new"
            className="font-bold py-2.5 px-5 rounded-lg inline-flex items-center gap-2 shadow-sm"
            style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New sodality
          </Link>
        </PermissionGate>
      }
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <SodalitiesList />
      </Suspense>
    </PageShell>
  );
}
