"use client";

import { useState } from "react";
import { FormCard } from "@/components/ui/Field";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatusPill from "@/components/ui/StatusPill";
import { PermissionGate } from "@/src/session/PermissionGate";
import { P } from "@/src/session/permissions";
import { useLeaveSodality, useSodalityMembers } from "@/hooks/useSodalities";
import { formatDateOr } from "@/lib/utils";
import type { SodalityMembership, SodalityMembershipRole } from "@/src/types";

const ROLE_LABEL: Record<SodalityMembershipRole, string> = {
  member: "Member",
  animator: "Animator",
  asst_animator: "Asst. animator",
  secretary: "Secretary",
  treasurer: "Treasurer",
};

function MemberRow({ m, sodalityId, canManage }: { m: SodalityMembership; sodalityId: string; canManage: boolean }) {
  const leave = useLeaveSodality(sodalityId);
  const member = typeof m.member_id === "string" ? null : m.member_id;
  const isPast = Boolean(m.left_on);

  return (
    <li className="py-3 flex items-start justify-between gap-3 border-t first:border-t-0" style={{ borderColor: "#e2e8f0" }}>
      <div className="min-w-0">
        <p className="font-semibold text-sm" style={{ color: "#0D5C63" }}>
          {member ? member.name_ta || member.name : "—"}
          {member?.name_ta && member?.name && <span className="text-slate-400 font-normal"> · {member.name}</span>}
        </p>
        <p className="text-xs text-slate-500">
          {ROLE_LABEL[m.role] ?? m.role}
          {" · joined "}
          {formatDateOr(m.joined_on)}
          {isPast && ` · left ${formatDateOr(m.left_on)}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isPast && <StatusPill label="Past" tone="neutral" />}
        {canManage && !isPast && (
          <ConfirmDialog
            trigger={<button className="text-xs font-bold" style={{ color: "#dc2626" }}>End membership</button>}
            title={`End this membership?`}
            message="The membership is marked ended, not deleted, so when they were part of this sodality stays on record. They can be enrolled again later."
            confirmLabel="End membership"
            onConfirm={() => leave.mutateAsync(m._id).then(() => undefined)}
          />
        )}
      </div>
    </li>
  );
}

export function SodalityRoster({ sodalityId }: { sodalityId: string }) {
  const [includePast, setIncludePast] = useState(false);
  const { data, isLoading } = useSodalityMembers(sodalityId, {
    include_past: includePast ? "true" : undefined,
  });

  const rows = data?.data?.rows ?? [];
  // While includePast is off the API returns only active rows, so this count
  // is the active roster either way.
  const activeCount = rows.filter((m) => !m.left_on).length;

  return (
    <FormCard title={`Members (${activeCount})`}>
      <label className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <input type="checkbox" checked={includePast} onChange={(e) => setIncludePast(e.target.checked)} />
        Show past members
      </label>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading members…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">Nobody enrolled yet.</p>
      ) : (
        <ul>
          <PermissionGateRows rows={rows} sodalityId={sodalityId} />
        </ul>
      )}
    </FormCard>
  );
}

/** Split so useLeaveSodality's mutation is only ever reached by someone who holds the permission. */
function PermissionGateRows({ rows, sodalityId }: { rows: SodalityMembership[]; sodalityId: string }) {
  return (
    <PermissionGate
      permission={P.sodality.memberManage}
      fallback={
        <>
          {rows.map((m) => (
            <MemberRow key={m._id} m={m} sodalityId={sodalityId} canManage={false} />
          ))}
        </>
      }
    >
      {rows.map((m) => (
        <MemberRow key={m._id} m={m} sodalityId={sodalityId} canManage />
      ))}
    </PermissionGate>
  );
}
