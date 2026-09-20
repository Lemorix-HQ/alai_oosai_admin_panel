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
import { useFamilies } from "@/hooks/useFamilies";
import { useAnbiyams, useMandalams } from "@/hooks/useStructure";
import {
  RESIDENCE_LABEL,
  VERIFICATION_LABEL,
  cardNumber,
  verificationTone,
} from "@/src/lib/domain-labels";
import type { Anbiyam, Family, Mandalam, MemberBrief } from "@/src/types";

const nameOf = (ref: Family["head_member_id"]) =>
  !ref ? "—" : typeof ref === "string" ? "—" : ((ref as MemberBrief).name_ta || (ref as MemberBrief).name);

function FamiliesList() {
  const params = useSearchParams();
  const page = params.get("page") ?? "1";

  const { data, isLoading } = useFamilies({
    q: params.get("q") ?? undefined,
    anbiyam_id: params.get("anbiyam_id") ?? undefined,
    mandalam_id: params.get("mandalam_id") ?? undefined,
    verification_status: params.get("verification_status") ?? undefined,
    residence_status: params.get("residence_status") ?? undefined,
    members_complete: params.get("members_complete") ?? undefined,
    page,
  });
  const { data: anbiyamRes } = useAnbiyams();
  const { data: mandalamRes } = useMandalams();

  const anbiyams = (anbiyamRes?.data ?? []) as Anbiyam[];
  const mandalams = (mandalamRes?.data ?? []) as Mandalam[];
  const paged = data?.data;
  const rows = paged?.rows ?? [];

  const columns: Column<Family>[] = [
    {
      key: "family_code",
      header: "Card no.",
      render: (f) => <span className="font-mono">{cardNumber(f.family_code, f.card_year)}</span>,
    },
    { key: "head", header: "Head", render: (f) => nameOf(f.head_member_id) },
    { key: "spouse", header: "Spouse", secondary: true, render: (f) => nameOf(f.spouse_member_id) },
    {
      key: "anbiyam",
      header: "Anbiyam",
      render: (f) =>
        typeof f.anbiyam_id === "string"
          ? "—"
          : `${f.anbiyam_id.code}${f.anbiyam_id.name_ta ? ` · ${f.anbiyam_id.name_ta}` : ""}`,
    },
    { key: "phone", header: "Phone", secondary: true, render: (f) => f.primary_phone ?? "—" },
    {
      key: "verification",
      header: "Verification",
      render: (f) => (
        <StatusPill
          label={VERIFICATION_LABEL[f.verification_status] ?? f.verification_status}
          tone={verificationTone(f.verification_status)}
        />
      ),
    },
    {
      key: "members",
      header: "Members",
      render: (f) =>
        f.completeness?.members_complete ? (
          <StatusPill label="Complete" tone="success" />
        ) : (
          <StatusPill label="Incomplete" tone="warning" />
        ),
    },
  ];

  return (
    <>
      <FilterBar
        searchPlaceholder="Search by family code, phone or locality…"
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
            key: "mandalam_id",
            label: "Mandalam",
            options: mandalams.map((m) => ({ value: m._id, label: `${m.code} · ${m.name}` })),
          },
          {
            key: "verification_status",
            label: "Verification",
            options: Object.entries(VERIFICATION_LABEL).map(([value, label]) => ({ value, label })),
          },
          {
            key: "residence_status",
            label: "Residence",
            options: Object.entries(RESIDENCE_LABEL).map(([value, label]) => ({ value, label })),
          },
          {
            key: "members_complete",
            label: "Member list",
            options: [
              { value: "false", label: "Incomplete" },
              { value: "true", label: "Complete" },
            ],
          },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading families…</p>
      ) : (
        <>
          <ResourceTable
            rows={rows}
            columns={columns}
            rowHref={(f) => `/families/${f._id}`}
            empty={{
              icon: "home",
              title: "No families match",
              description: "Clear the filters, or add the first family in an Anbiyam.",
            }}
          />
          {paged && (
            <Pagination
              page={paged.page}
              pages={paged.pages}
              total={paged.total}
              shown={rows.length}
            />
          )}
        </>
      )}
    </>
  );
}

export default function FamiliesPage() {
  return (
    <PageShell
      title="Families"
      subtitle="The parish census, organised by Anbiyam."
      action={
        <PermissionGate permission={P.family.create}>
          <Link
            href="/families/new"
            className="font-bold py-2.5 px-5 rounded-lg inline-flex items-center gap-2 shadow-sm"
            style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New family
          </Link>
        </PermissionGate>
      }
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <FamiliesList />
      </Suspense>
    </PageShell>
  );
}
