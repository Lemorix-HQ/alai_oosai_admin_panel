"use client";

import Link from "next/link";
import { use, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import StatusPill from "@/components/ui/StatusPill";
import { Field, TamilTextArea } from "@/components/ui/Field";
import { PermissionGate } from "@/src/session/PermissionGate";
import { P } from "@/src/session/permissions";
import { useDecideSubmission, useSubmission } from "@/hooks/usePastoral";
import {
  CHANGE_REQUEST_TYPE_LABEL,
  MARITAL_LABEL,
  RELATIONSHIP_LABEL,
  REQUEST_STATUS_LABEL,
  SUBMISSION_STATUS_LABEL,
  requestStatusTone,
  submissionStatusTone,
} from "@/src/lib/domain-labels";
import type { ChangeRequest, SubmissionOutcome } from "@/src/types";
import { formatDateOr, formatIfDate } from "@/lib/utils";

/**
 * One value, in the words the parish uses.
 *
 * The raw payload holds `magal` and an ISO timestamp, which is what the API
 * stores and the wrong thing to put in front of somebody standing at a door.
 */
function readable(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);

  const v = String(value);
  if (key === "relationship_to_head") return RELATIONSHIP_LABEL[v] ?? v;
  if (key === "marital_status") return MARITAL_LABEL[v] ?? v;
  if (key === "gender") return v.charAt(0).toUpperCase() + v.slice(1);
  return formatIfDate(v);
}

/**
 * What a household typed into the schooling, college or work section.
 *
 * `payload.schooling` is an object of ids, so `readable` would print it as the
 * JSON it is. The ids are unresolved here on purpose — a change request stores
 * what was said, not a join — so this prints the fields that can be read and
 * says plainly that the name itself is confirmed at the door. The household's
 * own words for the course or the trade are usually the useful part anyway.
 */
const ACTIVITY_FIELD_LABEL: Record<string, string> = {
  standard: "Standard",
  course_year: "Year of course",
  degree: "Degree",
  nature_of_work: "Nature of work",
  as_of_year: "True as of",
};

function ActivityValue({
  block,
  names,
}: {
  block: Record<string, unknown>;
  names: Record<string, string>;
}) {
  const named = Object.entries(block).filter(
    ([k, v]) => k in ACTIVITY_FIELD_LABEL && v !== null && v !== undefined && v !== "",
  );

  // The one the block is about — school, college or occupation — and then
  // where. Resolved by the server: these are ids inside a Mixed payload, so
  // there is no populate that could have reached them.
  const chosen = ["school_id", "college_id", "occupation_id"]
    .map((k) => block[k])
    .find((v) => typeof v === "string") as string | undefined;
  const place = typeof block.place_id === "string" ? block.place_id : undefined;

  return (
    <div className="text-sm text-slate-700 space-y-0.5">
      {chosen && (
        <p className="font-bold">{names[chosen] ?? "— no longer on the parish list"}</p>
      )}
      {place && (
        <p>
          <span className="text-slate-400">Place: </span>
          {names[place] ?? "— no longer on the parish list"}
        </p>
      )}
      {named.map(([k, v]) => (
        <p key={k}>
          <span className="text-slate-400">{ACTIVITY_FIELD_LABEL[k]}: </span>
          {String(v)}
        </p>
      ))}
    </div>
  );
}

/** Is this one of the three blocks rather than a plain field? */
const isActivityKey = (k: string) => k === "schooling" || k === "college" || k === "work";

/** A payload rendered as the plain list of what the household actually said. */
function Payload({
  request,
  names = {},
}: {
  request: ChangeRequest;
  names?: Record<string, string>;
}) {
  const p = request.payload ?? {};
  const inner = (p.member ?? p.family ?? p) as Record<string, unknown>;

  // A block sent as explicit null is a removal, and the one case where null is
  // the message rather than the absence of one.
  const removals = Object.keys(inner).filter((k) => isActivityKey(k) && inner[k] === null);

  const entries = Object.entries(inner).filter(
    ([k, v]) => k !== "member_id" && v !== null && v !== undefined && v !== "",
  );

  if (entries.length === 0 && removals.length === 0) {
    return <p className="text-sm text-slate-500">Nothing recorded.</p>;
  }

  return (
    <>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className={isActivityKey(k) ? "sm:col-span-2" : undefined}>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {k.replace(/_/g, " ")}
            </dt>
            <dd className="text-sm text-slate-700 break-words">
              {isActivityKey(k) ? (
                <ActivityValue block={v as Record<string, unknown>} names={names} />
              ) : (
                readable(k, v)
              )}
            </dd>
          </div>
        ))}
      </dl>

      {removals.map((k) => (
        <p key={k} className="text-sm" style={{ color: "#92400e" }}>
          They say this person is no longer {k === "work" ? "working" : `at ${k === "schooling" ? "school" : "college"}`} — the
          block on the record will be cleared.
        </p>
      ))}
    </>
  );
}

/**
 * One household's sitting, and the decision on all of it at once.
 *
 * Every change is still its own `ChangeRequest` underneath — the server loops
 * its per-request methods, so each keeps its own status, its own guard and its
 * own audit line. What this screen changes is that a faculty member standing at
 * a door reads one page and presses one button, instead of finding six rows.
 *
 * A change already past the step being asked for is **skipped, not failed**, so
 * a sitting half-verified yesterday can be finished today.
 */
export default function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useSubmission(id);
  const decide = useDecideSubmission(id);

  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<SubmissionOutcome[] | null>(null);

  const s = data?.data;

  async function run(action: "verify" | "approve" | "reject" | "apply") {
    setError(null);
    setOutcomes(null);
    const res = await decide.mutateAsync({ action, note: note.trim() || undefined });
    if (!res.success) {
      setError(res.message);
      return;
    }
    setOutcomes(res.data?.outcomes ?? null);
    setNote("");
  }

  if (isLoading) {
    return (
      <PageShell title="From a family">
        <p className="text-sm text-slate-500">Loading…</p>
      </PageShell>
    );
  }

  if (!s) {
    return (
      <PageShell title="From a family">
        <p className="text-sm text-slate-500">That submission was not found.</p>
      </PageShell>
    );
  }

  const family = s.family_id && typeof s.family_id === "object" ? s.family_id : null;
  const open = s.status === "pending" || s.status === "under_verification";
  const failures = outcomes?.filter((o) => !o.ok) ?? [];

  return (
    <PageShell
      title={family ? family.family_code : "From a family"}
      subtitle={`Filled in by ${s.submitter_name}${
        s.submitter_relationship
          ? ` · ${RELATIONSHIP_LABEL[s.submitter_relationship] ?? s.submitter_relationship}`
          : ""
      }`}
      breadcrumb={[{ href: "/submissions", label: "From families" }, { label: family?.family_code ?? "" }]}
    >
      <div className="space-y-4 max-w-3xl">
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              label={SUBMISSION_STATUS_LABEL[s.status] ?? s.status}
              tone={submissionStatusTone(s.status)}
            />
            <span className="text-sm text-slate-500">
              {s.change_count} change{s.change_count === 1 ? "" : "s"} · sent {formatDateOr(s.submitted_at)}
            </span>
          </div>

          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {family && (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Family</dt>
                <dd>
                  <Link href={`/families/${family._id}`} style={{ color: "#0D5C63" }} className="font-bold">
                    {family.family_code}
                  </Link>
                  {family.locality ? <span className="text-slate-500"> · {family.locality}</span> : null}
                </dd>
              </div>
            )}
            {s.submitter_phone && (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Their number
                </dt>
                <dd>{s.submitter_phone}</dd>
              </div>
            )}
          </dl>

          {s.note && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Their note to the parish
              </p>
              <p className="text-sm whitespace-pre-wrap">{s.note}</p>
            </div>
          )}

          {s.shares_household_phone?.length > 0 && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
              {s.shares_household_phone.length} adult
              {s.shares_household_phone.length === 1 ? "" : "s"} said they have no number of their own and
              use the household&apos;s. Worth asking at the door — the phone is how a person signs in.
            </p>
          )}

          {s.based_on_family_updated_at && (
            <p className="text-xs text-slate-500">
              Filled in against the record as it stood on {formatDateOr(s.based_on_family_updated_at)}. If staff
              have edited it since, check before approving.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            What they changed
          </h2>

          {s.requests.map((r) => (
            <div key={r._id} className="rounded-lg border p-4 space-y-2" style={{ borderColor: "#e2e8f0" }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold" style={{ color: "#0D5C63" }}>
                  {CHANGE_REQUEST_TYPE_LABEL[r.type] ?? r.type}
                </p>
                <div className="flex items-center gap-2">
                  <StatusPill
                    label={REQUEST_STATUS_LABEL[r.status] ?? r.status}
                    tone={requestStatusTone(r.status)}
                  />
                  <Link href={`/requests/${r._id}`} className="text-xs font-bold" style={{ color: "#596065" }}>
                    open
                  </Link>
                </div>
              </div>
              <Payload request={r} names={s.lookup_names} />
              {r.decision_note && (
                <p className="text-xs text-slate-500">Note: {r.decision_note}</p>
              )}
            </div>
          ))}
        </section>

        {(open || s.status === "approved") && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Decision on the whole sitting
            </h2>

            <Field label="Note" lang="tamil" hint="Recorded on every change in this sitting.">
              <TamilTextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>

            <div className="flex flex-wrap gap-2">
              {s.status === "pending" && (
                <PermissionGate permission={P.request.verify}>
                  <button
                    disabled={decide.isPending}
                    onClick={() => void run("verify")}
                    className="font-bold py-2.5 px-5 rounded-lg shadow-sm disabled:opacity-50"
                    style={{ backgroundColor: "#0D5C63", color: "white" }}
                  >
                    Seen at the door — verify all {s.change_count}
                  </button>
                </PermissionGate>
              )}

              {s.status === "under_verification" && (
                <PermissionGate permission={P.request.approve}>
                  <button
                    disabled={decide.isPending}
                    onClick={() => void run("approve")}
                    className="font-bold py-2.5 px-5 rounded-lg shadow-sm disabled:opacity-50"
                    style={{ backgroundColor: "#0D5C63", color: "white" }}
                  >
                    Approve all {s.change_count}
                  </button>
                </PermissionGate>
              )}

              {s.status === "approved" && (
                <PermissionGate permission={P.request.approve}>
                  <button
                    disabled={decide.isPending}
                    onClick={() => void run("apply")}
                    className="font-bold py-2.5 px-5 rounded-lg shadow-sm disabled:opacity-50"
                    style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
                  >
                    Apply to the parish record
                  </button>
                </PermissionGate>
              )}

              {open && (
                <PermissionGate permission={P.request.verify}>
                  <button
                    disabled={decide.isPending}
                    onClick={() => void run("reject")}
                    className="font-bold py-2.5 px-5 rounded-lg border border-slate-200 disabled:opacity-50"
                    style={{ color: "#991b1b" }}
                  >
                    Reject the whole sitting
                  </button>
                </PermissionGate>
              )}
            </div>

            {s.status === "pending" && (
              <p className="text-xs text-slate-500">
                Nothing here is approved until someone has been to the door. A change already past this
                step is skipped rather than refused, so a sitting half-done yesterday can be finished
                today.
              </p>
            )}

            {error && <p className="text-sm font-medium text-red-700">{error}</p>}
          </section>
        )}

        {s.status === "partially_applied" && (
          <p
            className="text-sm rounded-lg px-4 py-3"
            style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
          >
            Some changes went in and some could not — each one above shows its own state. Nothing was
            rolled back. The ones still marked approved can be applied again once whatever blocked them
            is resolved.
          </p>
        )}

        {failures.length > 0 && (
          <section
            className="rounded-xl p-4 space-y-2"
            style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
          >
            <p className="text-sm font-bold">{failures.length} could not be done:</p>
            <ul className="text-sm space-y-1">
              {failures.map((f) => (
                <li key={f.id}>
                  {CHANGE_REQUEST_TYPE_LABEL[f.type] ?? f.type} — {f.reason}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageShell>
  );
}
