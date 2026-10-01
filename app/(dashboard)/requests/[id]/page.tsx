"use client";

import Link from "next/link";
import { use, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import StatusPill from "@/components/ui/StatusPill";
import { Field, TamilTextArea } from "@/components/ui/Field";
import { PermissionGate } from "@/src/session/PermissionGate";
import { P } from "@/src/session/permissions";
import { useSession } from "@/src/session/SessionProvider";
import {
  useApplyChangeRequest,
  useApproveChangeRequest,
  useChangeRequest,
  useRejectChangeRequest,
  useVerifyChangeRequest,
} from "@/hooks/usePastoral";
import {
  CHANGE_REQUEST_TYPE_LABEL,
  REQUEST_STATUS_LABEL,
  requestStatusTone,
} from "@/src/lib/domain-labels";
import type { ChangeRequest } from "@/src/types";

const onDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const familyOf = (ref: ChangeRequest["family_id"]) =>
  !ref ? null : typeof ref === "string" ? null : ref;

/**
 * The four steps, in order, with the one that is next highlighted.
 *
 * Approval is only offered once a request has been verified: the backend
 * refuses to approve a pending request, so offering the button would only
 * produce an error the user cannot act on.
 */
function Progress({ status }: { status: ChangeRequest["status"] }) {
  const steps = [
    { key: "raised", label: "Raised", done: true },
    {
      key: "verified",
      label: "Verified at the door",
      done: ["under_verification", "approved", "applied"].includes(status),
    },
    { key: "approved", label: "Approved", done: ["approved", "applied"].includes(status) },
    { key: "applied", label: "Applied", done: status === "applied" },
  ];

  if (status === "rejected" || status === "cancelled") {
    return (
      <p className="text-sm text-slate-500">
        This request was {status === "rejected" ? "rejected" : "cancelled"} and went no further.
      </p>
    );
  }

  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((s) => (
        <li key={s.key}>
          <StatusPill
            label={s.label}
            tone={s.done ? "success" : "neutral"}
            icon={s.done ? "check" : "radio_button_unchecked"}
          />
        </li>
      ))}
    </ol>
  );
}

export default function ChangeRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useSession();
  const { data, isLoading } = useChangeRequest(id);

  const verify = useVerifyChangeRequest(id);
  const approve = useApproveChangeRequest(id);
  const reject = useRejectChangeRequest(id);
  const apply = useApplyChangeRequest(id);

  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const request = data?.data;
  const busy = verify.isPending || approve.isPending || reject.isPending || apply.isPending;

  async function run(action: { mutateAsync: (p: { decision_note?: string }) => Promise<{ success: boolean; message: string }> }) {
    setError(null);
    const res = await action.mutateAsync({ decision_note: note.trim() || undefined });
    if (!res.success) setError(res.message);
    else setNote("");
  }

  if (isLoading) {
    return (
      <PageShell title="Change request">
        <p className="text-sm text-slate-500">Loading…</p>
      </PageShell>
    );
  }
  if (!request) {
    return (
      <PageShell title="Change request">
        <p className="text-sm text-slate-500">Request not found.</p>
      </PageShell>
    );
  }

  const family = familyOf(request.family_id);
  // Nobody decides their own request, so the buttons come off for the raiser.
  const ownRequest = Boolean(user?.id && request.requested_by_user_id === user.id);
  const open = ["pending", "under_verification"].includes(request.status);

  return (
    <PageShell
      title={CHANGE_REQUEST_TYPE_LABEL[request.type] ?? request.type}
      subtitle={family ? `Family ${family.family_code}` : undefined}
      breadcrumb={[{ href: "/requests", label: "Change requests" }, { label: "Request" }]}
      action={
        <StatusPill
          label={REQUEST_STATUS_LABEL[request.status] ?? request.status}
          tone={requestStatusTone(request.status)}
        />
      }
    >
      <div className="space-y-6 max-w-3xl">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <Progress status={request.status} />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            What was asked
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Family</dt>
              <dd className="font-mono font-bold">
                {family ? (
                  <Link href={`/families/${family._id}`} className="hover:underline">
                    {family.family_code}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Raised by</dt>
              <dd>
                {request.requester_name || "—"}
                {request.requester_phone ? ` · ${request.requester_phone}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Raised on</dt>
              <dd>{onDate(request.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Verified on</dt>
              <dd>{onDate(request.verified_on)}</dd>
            </div>
          </dl>

          {request.reason && (
            <div>
              <p className="text-xs text-slate-500">Reason given</p>
              <p className="text-sm">{request.reason}</p>
            </div>
          )}

          {Object.keys(request.payload ?? {}).length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Details</p>
              <dl className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
                {Object.entries(request.payload).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <dt className="text-slate-500 min-w-40">{key.replace(/_/g, " ")}</dt>
                    <dd className="font-medium">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {request.decision_note && (
            <div>
              <p className="text-xs text-slate-500">Decision note</p>
              <p className="text-sm">{request.decision_note}</p>
            </div>
          )}
        </section>

        {(open || request.status === "approved") && !ownRequest && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Decision</h2>

            <Field label="Note" hint="Recorded on the request and kept with it.">
              <TamilTextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>

            <div className="flex flex-wrap gap-2">
              {request.status === "pending" && (
                <PermissionGate permission={P.request.verify}>
                  <button
                    disabled={busy}
                    onClick={() => run(verify)}
                    className="font-bold py-2.5 px-5 rounded-lg shadow-sm disabled:opacity-50"
                    style={{ backgroundColor: "#0D5C63", color: "white" }}
                  >
                    Verified at the door
                  </button>
                </PermissionGate>
              )}

              {request.status === "under_verification" && (
                <PermissionGate permission={P.request.approve}>
                  <button
                    disabled={busy}
                    onClick={() => run(approve)}
                    className="font-bold py-2.5 px-5 rounded-lg shadow-sm disabled:opacity-50"
                    style={{ backgroundColor: "#0D5C63", color: "white" }}
                  >
                    Approve
                  </button>
                </PermissionGate>
              )}

              {request.status === "approved" && (
                <PermissionGate permission={P.request.approve}>
                  <button
                    disabled={busy}
                    onClick={() => run(apply)}
                    className="font-bold py-2.5 px-5 rounded-lg shadow-sm disabled:opacity-50"
                    style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
                  >
                    Apply the change
                  </button>
                </PermissionGate>
              )}

              {open && (
                <PermissionGate permission={P.request.verify}>
                  <button
                    disabled={busy}
                    onClick={() => run(reject)}
                    className="font-bold py-2.5 px-5 rounded-lg border border-slate-200 disabled:opacity-50"
                    style={{ color: "#991b1b" }}
                  >
                    Reject
                  </button>
                </PermissionGate>
              )}
            </div>

            {request.status === "pending" && (
              <p className="text-xs text-slate-500">
                A request is approved only after someone has been to the door. Until it is verified,
                there is nothing to approve.
              </p>
            )}

            {error && <p className="text-sm font-medium text-red-700">{error}</p>}
          </section>
        )}

        {ownRequest && open && (
          <p className="text-sm text-slate-500">
            You raised this request, so you cannot verify or approve it yourself. Someone else in the
            parish has to.
          </p>
        )}
      </div>
    </PageShell>
  );
}
