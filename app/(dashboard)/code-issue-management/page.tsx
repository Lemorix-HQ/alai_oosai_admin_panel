"use client";

import { useState } from "react";
import PageShell from "@/components/ui/PageShell";
import ResourceTable, { type Column } from "@/components/ui/ResourceTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RevealedAccessCode from "@/components/families/RevealedAccessCode";
import {
  useAccessCodeRequests,
  useDismissAccessCodeRequest,
  useIssueAccessCode,
} from "@/hooks/useSelfService";
import { formatDateOr } from "@/lib/utils";
import type { AccessCodeRequest } from "@/src/types";

/**
 * What a household's own "request a code" on `/family-update` leaves for
 * staff to act on. Issuing here calls the exact same `issueAccessCodeAction`
 * as the family page's `AccessCodeCard` — there is one issuance path, not
 * two — and the request disappears from this list because
 * `AccessCodeService.issue()` marks it fulfilled itself.
 */
export default function CodeIssueManagementPage() {
  const { data, isLoading } = useAccessCodeRequests();
  const dismiss = useDismissAccessCodeRequest();
  const [error, setError] = useState<string | null>(null);
  const [revealing, setRevealing] = useState<{ familyId: string; familyCode: string } | null>(null);
  const [revealed, setRevealed] = useState<{ code: string; familyCode: string } | null>(null);

  const rows = data?.data ?? [];

  const columns: Column<AccessCodeRequest>[] = [
    {
      key: "family_code",
      header: "Family",
      render: (r) => <span className="font-bold" style={{ color: "#0D5C63" }}>{r.family_code ?? "—"}</span>,
    },
    {
      key: "phone",
      header: "Contact number",
      render: (r) => <span className="text-sm" style={{ color: "#0D5C63" }}>{r.phone ?? "—"}</span>,
    },
    {
      key: "requested_at",
      header: "Requested",
      secondary: true,
      render: (r) => <span className="text-sm text-slate-500">{formatDateOr(r.requested_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <span className="flex justify-end gap-2 whitespace-nowrap">
          <button
            type="button"
            className="text-xs font-bold"
            style={{ color: "#0D5C63" }}
            disabled={!r.family_id}
            onClick={() => r.family_id && setRevealing({ familyId: r.family_id, familyCode: r.family_code ?? "" })}
          >
            Issue
          </button>
          <ConfirmDialog
            trigger={<button className="text-xs font-bold" style={{ color: "#dc2626" }}>Dismiss</button>}
            title={`Dismiss this request for ${r.family_code ?? "this family"}?`}
            message="The household will have to request a code again if they still need one."
            confirmLabel="Dismiss"
            onConfirm={async () => {
              const res = await dismiss.mutateAsync(r._id);
              if (!res.success) setError(res.message);
            }}
          />
        </span>
      ),
    },
  ];

  return (
    <PageShell
      title="Code Issue Management"
      subtitle="Security code requests raised from the family self-service form."
    >
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
        >
          {error}
        </div>
      )}

      {revealing && (
        <IssuePanel
          familyId={revealing.familyId}
          familyCode={revealing.familyCode}
          onIssued={(code) => {
            setRevealed({ code, familyCode: revealing.familyCode });
            setRevealing(null);
          }}
          onCancel={() => setRevealing(null)}
          onError={setError}
        />
      )}

      {revealed && (
        <div className="mb-4">
          <RevealedAccessCode
            code={revealed.code}
            familyCode={revealed.familyCode}
            onDone={() => setRevealed(null)}
          />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <ResourceTable
          rows={rows}
          columns={columns}
          empty={{
            icon: "key",
            title: "No pending requests",
            description: "A household asking for a code on /family-update will show up here.",
          }}
        />
      )}
    </PageShell>
  );
}

/**
 * A small confirm step before issuing — issuing replaces whatever code might
 * already be out for this family, same as `AccessCodeCard`'s own dialog.
 */
function IssuePanel({
  familyId,
  familyCode,
  onIssued,
  onCancel,
  onError,
}: {
  familyId: string;
  familyCode: string;
  onIssued: (code: string) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  const issue = useIssueAccessCode(familyId);

  return (
    <div className="mb-4 rounded-lg border p-4 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "#e2e8f0" }}>
      <p className="text-sm text-slate-600">
        Issue a code for <strong>{familyCode || "this family"}</strong>? If one is already out, it
        stops working immediately.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={issue.isPending}
          onClick={async () => {
            const res = await issue.mutateAsync();
            if (!res.success || !res.data) {
              onError(res.message);
              return;
            }
            onIssued(res.data.code);
          }}
          className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-60"
          style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
        >
          {issue.isPending ? "Issuing…" : "Confirm issue"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-lg border text-xs font-bold"
          style={{ borderColor: "#e2e8f0", color: "#596065" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
