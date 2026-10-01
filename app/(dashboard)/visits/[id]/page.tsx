"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import StatCard from "@/components/ui/StatCard";
import StatusPill from "@/components/ui/StatusPill";
import RecordVisitPanel, { type VisitTarget } from "@/components/pastoral/RecordVisitPanel";
import { PermissionGate } from "@/src/session/PermissionGate";
import { P } from "@/src/session/permissions";
import { useCompleteVisitRound, useVisitRound } from "@/hooks/usePastoral";
import { VISIT_OUTCOME_LABEL, roundProgress, visitOutcomeTone } from "@/src/lib/domain-labels";
import type { FamilyVisit } from "@/src/types";

const onDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const refId = (ref: unknown): string => {
  const doc = ref as { _id?: string };
  return doc?._id ?? String(ref);
};

interface ChecklistRow {
  family: VisitTarget;
  visit: FamilyVisit | null;
}

export default function VisitRoundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useVisitRound(id);
  const complete = useCompleteVisitRound(id);
  const [recording, setRecording] = useState<VisitTarget | null>(null);

  const round = data?.data;

  /**
   * One list, in the order the work happens: the families nobody has been to
   * yet, then the ones already done. Two separate lists made a faculty member
   * scroll past everything finished to find what was left.
   */
  const checklist = useMemo<ChecklistRow[]>(() => {
    if (!round) return [];

    // visits arrive newest first, so the first one seen for a family is its latest
    const latest = new Map<string, FamilyVisit>();
    for (const v of round.visits) {
      const fid = refId(v.family_id);
      if (!latest.has(fid)) latest.set(fid, v);
    }

    const notYet: ChecklistRow[] = round.outstanding.map((f) => ({
      family: {
        _id: f._id,
        family_code: f.family_code,
        locality: f.locality,
        primary_phone: f.primary_phone,
      },
      visit: null,
    }));

    const done: ChecklistRow[] = [...latest.entries()].map(([fid, v]) => {
      const ref = v.family_id as { family_code?: string; locality?: string; primary_phone?: string };
      return {
        family: {
          _id: fid,
          family_code: ref?.family_code ?? "—",
          locality: ref?.locality,
          primary_phone: ref?.primary_phone,
        },
        visit: v,
      };
    });

    return [...notYet, ...done];
  }, [round]);

  if (isLoading) {
    return (
      <PageShell title="Visit round">
        <p className="text-sm text-slate-500">Loading…</p>
      </PageShell>
    );
  }
  if (!round) {
    return (
      <PageShell title="Visit round">
        <p className="text-sm text-slate-500">Round not found.</p>
      </PageShell>
    );
  }

  const anbiyam =
    typeof round.anbiyam_id === "string"
      ? "—"
      : `${round.anbiyam_id.code}${round.anbiyam_id.name_ta ? ` · ${round.anbiyam_id.name_ta}` : ""}`;
  const closed = round.status === "complete";

  return (
    <PageShell
      title={anbiyam}
      subtitle={`${round.label ?? "Visit round"} · ${onDate(round.round_date)}`}
      breadcrumb={[{ href: "/visits", label: "Visits" }, { label: anbiyam }]}
      action={
        !closed ? (
          <PermissionGate permission={P.visit.roundManage}>
            <ConfirmDialog
              title="Complete this round?"
              message="The round is closed to further visits from the panel. Its counts stay as they are."
              confirmLabel="Complete round"
              tone="primary"
              onConfirm={async () => {
                await complete.mutateAsync();
              }}
              trigger={
                <button
                  className="font-bold py-2.5 px-5 rounded-lg inline-flex items-center gap-2 shadow-sm"
                  style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
                >
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Complete round
                </button>
              }
            />
          </PermissionGate>
        ) : (
          <StatusPill label="Complete" tone="success" icon="check_circle" />
        )
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <StatCard
          label="Verified"
          value={roundProgress(round.verified_count, round.total_families)}
          icon="verified"
          hint="Families gone through and confirmed."
        />
        <StatCard label="Visits recorded" value={round.visits.length} icon="directions_walk" />
        <StatCard
          label="Still to visit"
          value={round.outstanding.length}
          icon="pending_actions"
          hint="Active families with no visit on this round."
        />
      </div>

      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
        Families in this Anbiyam
      </h2>

      {checklist.length === 0 ? (
        <EmptyState
          icon="home"
          title="No active families in this Anbiyam"
          description="Nothing to visit on this round."
        />
      ) : (
        <div className="rounded-xl border bg-white divide-y" style={{ borderColor: "#e2e8f0" }}>
          {checklist.map(({ family, visit }) => (
            <div
              key={family._id}
              className="flex flex-wrap items-center justify-between gap-2 p-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/families/${family._id}`}
                  className="font-mono font-bold hover:underline"
                  style={{ color: "#0D5C63" }}
                >
                  {family.family_code}
                </Link>
                <p className="text-xs text-slate-500 truncate">
                  {family.locality || "—"}
                  {family.primary_phone ? ` · ${family.primary_phone}` : ""}
                  {visit ? ` · ${onDate(visit.visit_date)}` : ""}
                  {visit?.acknowledgement ? ` · ${visit.acknowledgement}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {visit ? (
                  <StatusPill
                    label={VISIT_OUTCOME_LABEL[visit.outcome] ?? visit.outcome}
                    tone={visitOutcomeTone(visit.outcome)}
                  />
                ) : (
                  <StatusPill label="Not visited yet" tone="neutral" />
                )}
                <PermissionGate permission={P.visit.record}>
                  <button
                    onClick={() => setRecording(family)}
                    disabled={closed}
                    className="text-sm font-bold py-2 px-4 rounded-lg border disabled:opacity-40"
                    style={{ color: "#0D5C63", borderColor: "#cbd5e1" }}
                  >
                    {visit ? "Visit again" : "Record visit"}
                  </button>
                </PermissionGate>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* keyed by family: the notes and outcome typed for one household must
          not still be sitting in the form when the next one is opened */}
      <RecordVisitPanel
        key={recording?._id ?? "none"}
        roundId={id}
        family={recording}
        onClose={() => setRecording(null)}
      />
    </PageShell>
  );
}
