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
import { useChangeRequests } from "@/hooks/usePastoral";
import {
  CHANGE_REQUEST_TYPE_LABEL,
  REQUEST_STATUS_LABEL,
  requestStatusTone,
} from "@/src/lib/domain-labels";
import type { ChangeRequest } from "@/src/types";

const onDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const familyOf = (ref: ChangeRequest["family_id"]) =>
  !ref ? "—" : typeof ref === "string" ? "—" : ref.family_code;

function RequestsList() {
  const params = useSearchParams();
  const page = params.get("page") ?? "1";

  const { data, isLoading } = useChangeRequests({
    status: params.get("status") ?? undefined,
    type: params.get("type") ?? undefined,
    page,
  });

  const paged = data?.data;
  const rows = paged?.rows ?? [];

  const columns: Column<ChangeRequest>[] = [
    {
      key: "family",
      header: "Family",
      render: (r) => <span className="font-mono font-bold">{familyOf(r.family_id)}</span>,
    },
    {
      key: "type",
      header: "Request",
      render: (r) => CHANGE_REQUEST_TYPE_LABEL[r.type] ?? r.type,
    },
    { key: "requester", header: "Raised by", secondary: true, render: (r) => r.requester_name || "—" },
    { key: "raised", header: "Raised", secondary: true, render: (r) => onDate(r.createdAt) },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusPill
          label={REQUEST_STATUS_LABEL[r.status] ?? r.status}
          tone={requestStatusTone(r.status)}
        />
      ),
    },
  ];

  return (
    <>
      <FilterBar
        filters={[
          {
            key: "status",
            label: "Status",
            options: Object.entries(REQUEST_STATUS_LABEL).map(([value, label]) => ({ value, label })),
          },
          {
            key: "type",
            label: "Request",
            options: Object.entries(CHANGE_REQUEST_TYPE_LABEL).map(([value, label]) => ({
              value,
              label,
            })),
          },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading requests…</p>
      ) : (
        <>
          <ResourceTable
            rows={rows}
            columns={columns}
            rowHref={(r) => `/requests/${r._id}`}
            empty={{
              icon: "how_to_reg",
              title: "Nothing is waiting",
              description:
                "Requests raised by parishioners and Anbiyam heads appear here for verification and approval.",
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

export default function RequestsPage() {
  return (
    <PageShell
      title="Change requests"
      subtitle="Raised at home, verified at the door, approved by the priest."
      action={
        <PermissionGate permission={P.request.raise}>
          <Link
            href="/requests/new"
            className="font-bold py-2.5 px-5 rounded-lg inline-flex items-center gap-2 shadow-sm"
            style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Raise a request
          </Link>
        </PermissionGate>
      }
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <RequestsList />
      </Suspense>
    </PageShell>
  );
}
