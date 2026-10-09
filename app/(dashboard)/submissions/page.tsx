"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PageShell from "@/components/ui/PageShell";
import FilterBar from "@/components/ui/FilterBar";
import Pagination from "@/components/ui/Pagination";
import ResourceTable, { type Column } from "@/components/ui/ResourceTable";
import StatusPill from "@/components/ui/StatusPill";
import { useSubmissions } from "@/hooks/usePastoral";
import {
  RELATIONSHIP_LABEL,
  SUBMISSION_STATUS_LABEL,
  submissionStatusTone,
} from "@/src/lib/domain-labels";
import type { SelfServiceSubmission } from "@/src/types";
import { formatDateOr } from "@/lib/utils";

const familyOf = (ref: SelfServiceSubmission["family_id"]) =>
  !ref || typeof ref === "string" ? "—" : ref.family_code;

const anbiyamOf = (ref: SelfServiceSubmission["anbiyam_id"]) =>
  !ref || typeof ref === "string" ? "—" : `${ref.code} · ${ref.name_ta ?? ref.name ?? ""}`;

function SubmissionsList() {
  const params = useSearchParams();
  const page = params.get("page") ?? "1";

  const familyId = params.get("family_id") ?? undefined;

  const { data, isLoading } = useSubmissions({
    status: params.get("status") ?? undefined,
    family_id: familyId,
    page,
  });

  const paged = data?.data;
  const rows = paged?.rows ?? [];

  const columns: Column<SelfServiceSubmission>[] = [
    {
      key: "family",
      header: "Family",
      render: (s) => <span className="font-mono font-bold">{familyOf(s.family_id)}</span>,
    },
    { key: "anbiyam", header: "Anbiyam", secondary: true, render: (s) => anbiyamOf(s.anbiyam_id) },
    {
      key: "submitter",
      header: "Filled in by",
      render: (s) =>
        s.submitter_relationship
          ? `${s.submitter_name} · ${RELATIONSHIP_LABEL[s.submitter_relationship] ?? s.submitter_relationship}`
          : s.submitter_name,
    },
    {
      key: "change_count",
      header: "Changes",
      render: (s) => String(s.change_count),
    },
    { key: "sent", header: "Sent", secondary: true, render: (s) => formatDateOr(s.submitted_at) },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <StatusPill
          label={SUBMISSION_STATUS_LABEL[s.status] ?? s.status}
          tone={submissionStatusTone(s.status)}
        />
      ),
    },
  ];

  return (
    <>
      {familyId && (
        <p className="text-sm text-slate-500">
          Showing one family&apos;s submissions.{" "}
          <Link href="/submissions" style={{ color: "#0D5C63" }} className="font-bold">
            Show all
          </Link>
        </p>
      )}

      <FilterBar
        filters={[
          {
            key: "status",
            label: "Status",
            options: Object.entries(SUBMISSION_STATUS_LABEL).map(([value, label]) => ({
              value,
              label,
            })),
          },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          <ResourceTable
            rows={rows}
            columns={columns}
            rowHref={(s) => `/submissions/${s._id}`}
            empty={{
              icon: "drafts",
              title: "Nothing has been sent in",
              description:
                "A household fills its own details in at /family-update, using the access code you issue from its family page. What they send arrives here as one row.",
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

/**
 * What households have sent in through the public form.
 *
 * **One row per sitting, not one per change.** A family that added four members
 * and corrected two produced six change requests, because `payload` is a single
 * object and `add_member` applies exactly one person. Six rows scattered
 * through `/requests` is not something a faculty member can work through at a
 * front door — this is the row they open instead.
 */
export default function SubmissionsPage() {
  return (
    <PageShell
      title="From families"
      subtitle="Filled in at home, confirmed at the door, approved by the priest."
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <SubmissionsList />
      </Suspense>
    </PageShell>
  );
}
