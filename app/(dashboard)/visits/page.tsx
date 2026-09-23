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
import { useVisitRounds } from "@/hooks/usePastoral";
import { useAnbiyams } from "@/hooks/useStructure";
import { roundProgress } from "@/src/lib/domain-labels";
import type { Anbiyam, VisitRound } from "@/src/types";

const anbiyamOf = (ref: VisitRound["anbiyam_id"]) =>
  typeof ref === "string"
    ? "—"
    : `${ref.code}${ref.name_ta ? ` · ${ref.name_ta}` : ref.name ? ` · ${ref.name}` : ""}`;

const onDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

function RoundsList() {
  const params = useSearchParams();
  const page = params.get("page") ?? "1";

  const { data, isLoading } = useVisitRounds({
    anbiyam_id: params.get("anbiyam_id") ?? undefined,
    status: params.get("status") ?? undefined,
    page,
  });
  const { data: anbiyamRes } = useAnbiyams();
  const anbiyams = (anbiyamRes?.data ?? []) as Anbiyam[];

  const paged = data?.data;
  const rows = paged?.rows ?? [];

  const columns: Column<VisitRound>[] = [
    {
      key: "anbiyam",
      header: "Anbiyam",
      render: (r) => <span className="font-semibold">{anbiyamOf(r.anbiyam_id)}</span>,
    },
    { key: "label", header: "Round", render: (r) => r.label || "—" },
    { key: "date", header: "Visited on", render: (r) => onDate(r.round_date) },
    {
      key: "progress",
      header: "Verified",
      render: (r) => (
        <span className="font-mono">{roundProgress(r.verified_count, r.total_families)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        r.status === "complete" ? (
          <StatusPill label="Complete" tone="success" />
        ) : (
          <StatusPill label="Open" tone="warning" />
        ),
    },
  ];

  return (
    <>
      <FilterBar
        filters={[
          {
            key: "anbiyam_id",
            label: "Anbiyam",
            options: anbiyams.map((a) => ({
              value: a._id,
              label: `${a.code}${a.name_ta ? ` · ${a.name_ta}` : ""}`,
            })),
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "open", label: "Open" },
              { value: "complete", label: "Complete" },
            ],
          },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading rounds…</p>
      ) : (
        <>
          <ResourceTable
            rows={rows}
            columns={columns}
            rowHref={(r) => `/visits/${r._id}`}
            empty={{
              icon: "directions_walk",
              title: "No visit rounds yet",
              description:
                "A round is one visit to one Anbiyam. Open one, then record each family as you go.",
            }}
          />
          {paged && (
            <Pagination page={paged.page} pages={paged.pages} total={paged.total} shown={rows.length} />
          )}
        </>
      )}
    </>
  );
}

export default function VisitsPage() {
  return (
    <PageShell
      title="Visits"
      subtitle="Door-step verification, one Anbiyam at a time."
      action={
        <PermissionGate permission={P.visit.roundManage}>
          <Link
            href="/visits/new"
            className="font-bold py-2.5 px-5 rounded-lg inline-flex items-center gap-2 shadow-sm"
            style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Open a round
          </Link>
        </PermissionGate>
      }
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <RoundsList />
      </Suspense>
    </PageShell>
  );
}
