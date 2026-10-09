"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PageShell from "@/components/ui/PageShell";
import FilterBar from "@/components/ui/FilterBar";
import Pagination from "@/components/ui/Pagination";
import CellLink from "@/components/ui/CellLink";
import ResourceTable, { type Column } from "@/components/ui/ResourceTable";
import StatusPill from "@/components/ui/StatusPill";
import { PermissionGate } from "@/src/session/PermissionGate";
import { P } from "@/src/session/permissions";
import { useFamilies } from "@/hooks/useFamilies";
import { useAnbiyams, useMandalams } from "@/hooks/useStructure";
import {
  FAMILY_STATUS_LABEL,
  RESIDENCE_LABEL,
  VERIFICATION_LABEL,
  cardNumber,
  familyStatusTone,
  verificationTone,
} from "@/src/lib/domain-labels";
import type { Anbiyam, Family, Mandalam, MemberBrief } from "@/src/types";

const nameOf = (ref: Family["head_member_id"]) =>
  !ref ? "—" : typeof ref === "string" ? "—" : ((ref as MemberBrief).name_ta || (ref as MemberBrief).name);

/**
 * The Anbiyam a family sits in, linked to its place on the structure page so
 * the Mandalam above it is one click away rather than a hunt.
 */
function AnbiyamCell({ anbiyam }: { anbiyam: Pick<Anbiyam, "_id" | "code" | "name" | "name_ta"> }) {
  return (
    <CellLink
      href={`/structure?anbiyam=${anbiyam._id}`}
      title="Show this Anbiyam in the parish structure"
      // The structure page scrolls this Anbiyam into view itself.
      scroll={false}
    >
      {anbiyam.code}
      {anbiyam.name_ta ? ` · ${anbiyam.name_ta}` : ""}
    </CellLink>
  );
}

function FamiliesList() {
  const params = useSearchParams();
  const page = params.get("page") ?? "1";

  // Absent means active, which is what the API defaults to — the census is the
  // living parish. Anything else is the archive: families that left, kept with
  // the code they held, whose slot has since been reissued.
  const status = params.get("status") ?? "active";
  const viewingArchive = status !== "active";

  const { data, isLoading } = useFamilies({
    q: params.get("q") ?? undefined,
    anbiyam_id: params.get("anbiyam_id") ?? undefined,
    mandalam_id: params.get("mandalam_id") ?? undefined,
    verification_status: params.get("verification_status") ?? undefined,
    residence_status: params.get("residence_status") ?? undefined,
    members_complete: params.get("members_complete") ?? undefined,
    status,
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
        typeof f.anbiyam_id === "string" ? "—" : <AnbiyamCell anbiyam={f.anbiyam_id} />,
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

  // Only in the archive. On the census every row is active, so the column
  // would carry the same word 1,755 times.
  if (viewingArchive) {
    columns.push({
      key: "status",
      header: "Status",
      render: (f) => (
        <StatusPill
          label={FAMILY_STATUS_LABEL[f.status] ?? f.status}
          tone={familyStatusTone(f.status)}
        />
      ),
    });
  }

  return (
    <>
      {viewingArchive && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "#ffddb8", color: "#744800" }}
        >
          {status === "all"
            ? "Showing the census and its history together. A family listed here as anything but active no longer holds its code — the slot may belong to another household now."
            : "These families have left the parish register. They keep the code they held for reference; the slot itself has been released and may already belong to another household. Read-only."}
        </div>
      )}

      <FilterBar
        searchPlaceholder="Search by head or spouse name, family code or phone…"
        filters={[
          {
            key: "status",
            label: "Status",
            // Unset is active, not "all" — so say so rather than let the
            // default wording promise the archive is included.
            unsetLabel: "Status: Active",
            options: [
              { value: "transferred_out", label: "Transferred out" },
              { value: "closed", label: "Closed" },
              { value: "merged", label: "Merged" },
              // The old-paper case: a code read off a 2015 receipt, where
              // which way the family left is what you are trying to find out.
              { value: "all", label: "Active and history" },
            ],
          },
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
