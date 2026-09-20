"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PageShell from "@/components/ui/PageShell";
import FilterBar from "@/components/ui/FilterBar";
import Pagination from "@/components/ui/Pagination";
import ResourceTable, { type Column } from "@/components/ui/ResourceTable";
import StatusPill from "@/components/ui/StatusPill";
import { useMembers } from "@/hooks/useFamilies";
import {
  MARITAL_LABEL,
  MEMBER_STATUS_LABEL,
  RELATIONSHIP_LABEL,
  ageFrom,
} from "@/src/lib/domain-labels";
import type { Member } from "@/src/types";

function MembersList() {
  const params = useSearchParams();
  const { data, isLoading } = useMembers({
    q: params.get("q") ?? undefined,
    status: params.get("status") ?? undefined,
    page: params.get("page") ?? "1",
  });

  const paged = data?.data;
  const rows = paged?.rows ?? [];

  const columns: Column<Member>[] = [
    {
      key: "name",
      header: "Name",
      render: (m) => (
        <span>
          {m.name_ta || m.name}
          {m.name_ta && m.name && <span className="block text-xs text-slate-400">{m.name}</span>}
        </span>
      ),
    },
    {
      key: "family",
      header: "Family",
      render: (m) =>
        typeof m.family_id === "string" ? "—" : <span className="font-mono">{m.family_id.family_code}</span>,
    },
    {
      key: "relationship",
      header: "Relationship",
      render: (m) => RELATIONSHIP_LABEL[m.relationship_to_head] ?? m.relationship_to_head,
    },
    { key: "gender", header: "Sex", render: (m) => (m.gender === "male" ? "M" : "F") },
    {
      key: "age",
      header: "Age",
      render: (m) => {
        const age = ageFrom(m.date_of_birth);
        return age === null ? "—" : `${age}${m.dob_is_estimated ? "≈" : ""}`;
      },
    },
    {
      key: "marital",
      header: "Marital",
      secondary: true,
      render: (m) => MARITAL_LABEL[m.marital_status] ?? m.marital_status,
    },
    { key: "phone", header: "Phone", secondary: true, render: (m) => m.phone ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (m) => (
        <StatusPill
          label={MEMBER_STATUS_LABEL[m.status] ?? m.status}
          tone={m.status === "active" ? "success" : "neutral"}
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
            key: "status",
            label: "Status",
            options: Object.entries(MEMBER_STATUS_LABEL).map(([value, label]) => ({ value, label })),
          },
        ]}
      />
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading members…</p>
      ) : (
        <>
          <ResourceTable
            rows={rows}
            columns={columns}
            rowHref={(m) =>
              typeof m.family_id === "string" ? `/families/${m.family_id}` : `/families/${m.family_id._id}`
            }
            empty={{
              icon: "groups",
              title: "No members match",
              description: "Members are added from a family card, not from here.",
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

export default function MembersPage() {
  return (
    <PageShell
      title="Members"
      subtitle="Everyone known to the parish. A member is a person, not a login — most never have an account."
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <MembersList />
      </Suspense>
    </PageShell>
  );
}
