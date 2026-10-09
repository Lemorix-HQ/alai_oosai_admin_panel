"use client";

import { useState } from "react";
import StatusPill from "@/components/ui/StatusPill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { FormCard } from "@/components/ui/Field";
import { PermissionGate } from "@/src/session/PermissionGate";
import { P } from "@/src/session/permissions";
import {
  useAccessCodeStatus,
  useIssueAccessCode,
  useRevokeAccessCode,
} from "@/hooks/useSelfService";
import { formatDate } from "@/lib/utils";
import type { AccessCodeState } from "@/src/types";

const STATE: Record<AccessCodeState, { label: string; tone: "success" | "neutral" | "warning" }> = {
  active: { label: "Code issued", tone: "success" },
  never: { label: "No code", tone: "neutral" },
  expired: { label: "Expired", tone: "warning" },
  revoked: { label: "Revoked", tone: "warning" },
};

/**
 * The code a household needs to open the public self-service form, handed over
 * by whoever is in front of them — usually the Anbiyam head.
 *
 * The code is shown **once**, here, in the response to issuing it. The server
 * keeps only a bcrypt hash, so there is no "show it again": a lost slip is
 * answered by issuing a new one, which is also what kills the lost one. That is
 * the same handling an invitation link gets.
 */
export default function AccessCodeCard({
  familyId,
  familyCode,
}: {
  familyId: string;
  familyCode: string;
}) {
  const { data, isLoading } = useAccessCodeStatus(familyId);
  const issue = useIssueAccessCode(familyId);
  const revoke = useRevokeAccessCode(familyId);

  // Held here and nowhere else. Deliberately not in the query cache: a
  // reveal-once secret must not be readable by another component or come back
  // when this card remounts.
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = data?.data;
  const state: AccessCodeState = status?.state ?? "never";
  const hasLiveCode = state === "active";

  async function doIssue() {
    setError(null);
    setCopied(false);
    const res = await issue.mutateAsync();
    if (!res.success || !res.data) {
      setError(res.message);
      return;
    }
    setRevealed(res.data.code);
  }

  async function copy() {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed);
      setCopied(true);
    } catch {
      // An insecure origin or a browser that refuses the permission. The code
      // is on screen either way, which is what actually matters.
      setError("Could not copy — write the code down from the screen.");
    }
  }

  return (
    <FormCard title="Self-service access code">
      {revealed ? (
        <div
          className="rounded-lg p-4 space-y-3"
          style={{ backgroundColor: "#f0fdfc", border: "1px solid #99d6d1" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#0D5C63" }}>
            Write this down now
          </p>
          <p
            className="text-2xl font-bold tracking-[0.2em] font-mono select-all break-all"
            style={{ color: "#0D5C63" }}
          >
            {revealed}
          </p>
          <p className="text-xs text-slate-600">
            This is the only time the code is shown. It is not stored anywhere it can be read
            back — if it is lost, issue a new one. Give it to the family together with their
            family code, <strong>{familyCode}</strong>.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="px-3 py-2 rounded-lg text-xs font-bold"
              style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
            >
              {copied ? "Copied" : "Copy code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRevealed(null);
                setCopied(false);
              }}
              className="px-3 py-2 rounded-lg border text-xs font-bold"
              style={{ borderColor: "#e2e8f0", color: "#596065" }}
            >
              I have written it down
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <span className="text-sm text-slate-500">Loading…</span>
            ) : (
              <StatusPill label={STATE[state].label} tone={STATE[state].tone} />
            )}
          </div>

          <p className="text-xs text-slate-500">
            {hasLiveCode
              ? `A code is out for ${familyCode}. Issuing another cancels it.`
              : `The family enters this code with ${familyCode} to fill in their own details before a visit.`}
          </p>

          {status?.issued_at && (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Issued
                </dt>
                <dd className="text-slate-700">{formatDate(status.issued_at)}</dd>
              </div>
              {status.expires_at && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {hasLiveCode ? "Expires" : "Expired"}
                  </dt>
                  <dd className="text-slate-700">{formatDate(status.expires_at)}</dd>
                </div>
              )}
            </dl>
          )}

          {status?.locked_until && (
            <p
              className="text-xs rounded-lg px-3 py-2"
              style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
            >
              Too many wrong codes have been tried for this family. It is locked until{" "}
              {formatDate(status.locked_until)}. Issuing a new code lifts the lock, because the
              locked code is cancelled and the new one starts with a fresh five attempts.
            </p>
          )}

          <PermissionGate permission={P.family.accessCodeManage}>
            <div className="flex flex-wrap gap-2">
              {hasLiveCode ? (
                <ConfirmDialog
                  trigger={
                    <button
                      className="px-3 py-2 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
                    >
                      Issue a new code
                    </button>
                  }
                  title={`Replace the access code for ${familyCode}?`}
                  message={`The code already issued stops working immediately. If the family is holding a slip with it, they will not be able to use it — hand them the new one instead.`}
                  confirmLabel="Issue a new code"
                  tone="primary"
                  onConfirm={doIssue}
                />
              ) : (
                <button
                  type="button"
                  onClick={doIssue}
                  disabled={issue.isPending}
                  className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-60"
                  style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
                >
                  {issue.isPending ? "Issuing…" : "Issue a code"}
                </button>
              )}

              {hasLiveCode && (
                <ConfirmDialog
                  trigger={
                    <button
                      className="px-3 py-2 rounded-lg border text-xs font-bold"
                      style={{ borderColor: "#e2e8f0", color: "#dc2626" }}
                    >
                      Revoke
                    </button>
                  }
                  title={`Revoke the access code for ${familyCode}?`}
                  message="The family will not be able to open the form until a new code is issued. Nothing they have already submitted is affected."
                  confirmLabel="Revoke"
                  onConfirm={async () => {
                    setError(null);
                    const res = await revoke.mutateAsync();
                    if (!res.success) setError(res.message);
                  }}
                />
              )}
            </div>
          </PermissionGate>
        </>
      )}

      {error && (
        <p
          className="text-xs rounded-lg px-3 py-2"
          style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
        >
          {error}
        </p>
      )}
    </FormCard>
  );
}
