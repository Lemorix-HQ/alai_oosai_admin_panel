"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PageShell from "@/components/ui/PageShell";
import FilterBar from "@/components/ui/FilterBar";
import Pagination from "@/components/ui/Pagination";
import CellLink from "@/components/ui/CellLink";
import ResourceTable, { type Column } from "@/components/ui/ResourceTable";
import StatusPill from "@/components/ui/StatusPill";
import { useMembers } from "@/hooks/useFamilies";
import { useLookup } from "@/hooks/useLookups";
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
    school_id: params.get("school_id") ?? undefined,
    college_id: params.get("college_id") ?? undefined,
    occupation_id: params.get("occupation_id") ?? undefined,
    place_id: params.get("place_id") ?? undefined,
    activity_year: params.get("activity_year") ?? undefined,
    page: params.get("page") ?? "1",
  });

  // The four lists feed the filter dropdowns. Cached for five minutes, so
  // this costs nothing on repeat visits.
  // 200 is the API's own ceiling. Left unset it caps at 50 and the dropdown
  // quietly loses entries as a parish's lists grow.
  const { data: schools } = useLookup("school", undefined, 200);
  const { data: colleges } = useLookup("college", undefined, 200);
  const { data: occupations } = useLookup("occupation", undefined, 200);
  const { data: places } = useLookup("place", undefined, 200);
  const opts = (res: { data?: Array<{ _id: string; name: string; name_ta?: string }> } | undefined) =>
    (res?.data ?? []).map((r) => ({ value: r._id, label: r.name_ta || r.name }));

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
      // The row itself opens the member for editing, so the household it
      // belongs to needs its own way through — otherwise checking a member
      // against their family card means going back and searching for it.
      render: (m) =>
        typeof m.family_id === "string" ? (
          "—"
        ) : (
          <CellLink
            href={`/families/${m.family_id._id}`}
            title="Open this family's card"
            className="font-mono"
          >
            {m.family_id.family_code}
          </CellLink>
        ),
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
      key: "activity",
      header: "Studying / Working",
      render: (m) => {
        const year = new Date().getFullYear();
        const parts: string[] = [];
        if (m.schooling && typeof m.schooling.school_id !== "string") {
          parts.push(
            [m.schooling.standard, m.schooling.school_id.name].filter(Boolean).join(" · "),
          );
        }
        if (m.college && typeof m.college.college_id !== "string") {
          parts.push([m.college.degree, m.college.college_id.name].filter(Boolean).join(" · "));
        }
        if (m.work && typeof m.work.occupation_id !== "string") {
          const place =
            m.work.place_id && typeof m.work.place_id !== "string" ? m.work.place_id.name : null;
          parts.push([m.work.occupation_id.name, place].filter(Boolean).join(" · "));
        }
        if (parts.length === 0) return "—";
        const newest = Math.max(
          m.schooling?.as_of_year ?? 0,
          m.college?.as_of_year ?? 0,
          m.work?.as_of_year ?? 0,
        );
        return (
          // Muted once the newest record is behind the current year, so a
          // stale row looks stale instead of looking like today's truth.
          <span className={newest < year ? "text-slate-400" : ""}>
            {parts.join(" / ")} <span className="text-xs text-slate-400">· {newest}</span>
          </span>
        );
      },
    },
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
          { key: "school_id", label: "School", options: opts(schools) },
          { key: "college_id", label: "College", options: opts(colleges) },
          { key: "occupation_id", label: "Occupation", options: opts(occupations) },
          { key: "place_id", label: "Place", options: opts(places) },
        ]}
      />
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading members…</p>
      ) : (
        <>
          <ResourceTable
            rows={rows}
            columns={columns}
            rowHref={(m) => `/members/${m._id}/edit`}
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
