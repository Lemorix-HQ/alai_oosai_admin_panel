"use client";

import Link from "next/link";
import { use, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import StatusPill from "@/components/ui/StatusPill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { FormCard, Select } from "@/components/ui/Field";
import { PermissionGate } from "@/src/session/PermissionGate";
import { P } from "@/src/session/permissions";
import { useCloseFamily, useFamily, useRemoveMember, useUpdateFamily } from "@/hooks/useFamilies";
import {
  MARITAL_LABEL,
  MEMBER_STATUS_LABEL,
  PASTORAL_FLAG_LABEL,
  RELATIONSHIP_LABEL,
  RESIDENCE_LABEL,
  VERIFICATION_LABEL,
  ageFrom,
  cardNumber,
  verificationTone,
} from "@/src/lib/domain-labels";
import type { Member } from "@/src/types";

function MemberRow({ m, familyId, canEdit }: { m: Member; familyId: string; canEdit: boolean }) {
  const remove = useRemoveMember(familyId);
  const age = ageFrom(m.date_of_birth);

  return (
    <li className="py-3 flex items-start justify-between gap-3 border-t first:border-t-0" style={{ borderColor: "#e2e8f0" }}>
      <div className="min-w-0">
        <p className="font-semibold text-sm" style={{ color: "#0D5C63" }}>
          {m.name_ta || m.name}
          {m.name_ta && m.name && <span className="text-slate-400 font-normal"> · {m.name}</span>}
        </p>
        <p className="text-xs text-slate-500">
          {RELATIONSHIP_LABEL[m.relationship_to_head] ?? m.relationship_to_head}
          {" · "}
          {m.gender === "male" ? "M" : "F"}
          {age !== null && ` · ${age}${m.dob_is_estimated ? "≈" : ""}`}
          {m.marital_status && m.marital_status !== "unknown" && ` · ${MARITAL_LABEL[m.marital_status]}`}
          {m.phone && ` · ${m.phone}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {m.status !== "active" && (
          <StatusPill label={MEMBER_STATUS_LABEL[m.status] ?? m.status} tone="neutral" />
        )}
        <PermissionGate permission={P.member.update}>
          <Link href={`/members/${m._id}/edit`} className="text-xs font-bold" style={{ color: "#0D5C63" }}>
            Edit
          </Link>
        </PermissionGate>
        {canEdit && (
          <ConfirmDialog
            trigger={<button className="text-xs font-bold" style={{ color: "#dc2626" }}>Remove</button>}
            title={`Remove ${m.name}?`}
            message="The record is soft-deleted, not erased — registers and certificates referencing this person stay intact."
            confirmLabel="Remove"
            onConfirm={() => remove.mutateAsync(m._id).then(() => undefined)}
          />
        )}
      </div>
    </li>
  );
}

export default function FamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useFamily(id);
  const update = useUpdateFamily(id);
  const close = useCloseFamily(id);
  const [error, setError] = useState<string | null>(null);

  const family = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Family">
        <p className="text-sm text-slate-500">Loading…</p>
      </PageShell>
    );
  }
  if (!family) {
    return (
      <PageShell title="Family" breadcrumb={[{ href: "/families", label: "Families" }]}>
        <p className="text-sm text-slate-500">{data?.message ?? "Family not found."}</p>
      </PageShell>
    );
  }

  const anbiyam = typeof family.anbiyam_id === "string" ? null : family.anbiyam_id;
  const members = family.members ?? [];

  return (
    <PageShell
      title={cardNumber(family.family_code, family.card_year)}
      subtitle={
        anbiyam
          ? `${anbiyam.code}${anbiyam.name_ta ? ` · ${anbiyam.name_ta}` : ""}`
          : undefined
      }
      breadcrumb={[{ href: "/families", label: "Families" }, { label: family.family_code }]}
      action={
        <div className="flex flex-wrap gap-2">
          <PermissionGate permission={P.member.create}>
            <Link
              href={`/families/${id}/members/new`}
              className="font-bold py-2.5 px-4 rounded-lg border text-sm"
              style={{ borderColor: "#dce3e9", color: "#0D5C63" }}
            >
              Add member
            </Link>
          </PermissionGate>
          <PermissionGate permission={P.family.transfer}>
            <Link
              href={`/families/${id}/transfer`}
              className="font-bold py-2.5 px-4 rounded-lg border text-sm"
              style={{ borderColor: "#dce3e9", color: "#0D5C63" }}
            >
              Transfer
            </Link>
          </PermissionGate>
          <PermissionGate permission={P.family.update}>
            <Link
              href={`/families/${id}/edit`}
              className="font-bold py-2.5 px-5 rounded-lg text-sm shadow-sm"
              style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
            >
              Edit
            </Link>
          </PermissionGate>
        </div>
      }
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      {family.status !== "active" && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: "#ffddb8", color: "#744800" }}>
          This family is {family.status.replace("_", " ")}. Its position {family.serial_in_anbiyam} in{" "}
          {anbiyam?.code ?? "the Anbiyam"} has been released and may already belong to another household.
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <StatusPill
          label={VERIFICATION_LABEL[family.verification_status] ?? family.verification_status}
          tone={verificationTone(family.verification_status)}
        />
        <StatusPill
          label={family.completeness?.members_complete ? "Member list complete" : "Member list incomplete"}
          tone={family.completeness?.members_complete ? "success" : "warning"}
        />
        <StatusPill
          label={RESIDENCE_LABEL[family.residence?.status ?? "unknown"]}
          tone={family.residence?.status === "resident" ? "info" : "neutral"}
        />
        {(family.pastoral_flags ?? []).map((f) => (
          <StatusPill key={f} label={PASTORAL_FLAG_LABEL[f] ?? f} tone="warning" />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <FormCard title={`Members (${members.length})`}>
            {members.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nobody recorded yet. A seeded family carries only its head and spouse until a visit fills in the rest.
              </p>
            ) : (
              <ul>
                {members.map((m) => (
                  <PermissionGateMemberRow key={m._id} m={m} familyId={id} />
                ))}
              </ul>
            )}

            <PermissionGate permission={P.family.update}>
              <div className="pt-3 border-t" style={{ borderColor: "#e2e8f0" }}>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#596065" }}>
                  Is this member list complete?
                </label>
                <Select
                  value={family.completeness?.members_complete ? "true" : "false"}
                  onChange={async (e) => {
                    const res = await update.mutateAsync({
                      members_complete: e.target.value === "true",
                    });
                    if (!res.success) setError(res.message);
                  }}
                >
                  <option value="false">No — people are still missing</option>
                  <option value="true">Yes — everyone is recorded</option>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  Recorded rather than inferred: a family with two members entered looks exactly
                  like a family of two.
                </p>
              </div>
            </PermissionGate>
          </FormCard>

          {(family.married_out ?? []).length > 0 && (
            <FormCard
              title={`Married out (${family.married_out.length})`}
              description="Born into this family, now belonging to another household. Still listed on the parents' card."
            >
              <ul className="space-y-2 text-sm">
                {family.married_out.map((m) => (
                  <li key={m._id} className="flex items-center justify-between gap-3">
                    <span>{m.name_ta || m.name}</span>
                    <span className="text-xs text-slate-400">
                      {m.transferred_to_parish_name ?? "Within the parish"}
                    </span>
                  </li>
                ))}
              </ul>
            </FormCard>
          )}

          {(family.transfers ?? []).length > 0 && (
            <FormCard title="Transfer history">
              <ul className="space-y-3 text-sm">
                {family.transfers.map((t) => (
                  <li key={t._id} className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-xs">{t.old_family_code ?? "—"}</span>
                    <span className="material-symbols-outlined text-[14px] text-slate-400">arrow_forward</span>
                    <span className="font-mono text-xs font-bold" style={{ color: "#0D5C63" }}>
                      {t.new_family_code ?? "—"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(t.effective_on).toLocaleDateString()} · {t.type} · {t.assignment_method.replace("_", " ")}
                    </span>
                    {t.reason && <span className="text-xs text-slate-500 w-full">{t.reason}</span>}
                  </li>
                ))}
              </ul>
            </FormCard>
          )}
        </div>

        <div className="space-y-4">
          <FormCard title="Household">
            <dl className="space-y-2 text-sm">
              {[
                ["Family code", family.family_code],
                ["Position in Anbiyam", String(family.serial_in_anbiyam)],
                ["Card year", family.card_year ? String(family.card_year) : "—"],
                ["Phone", family.primary_phone ?? "—"],
                ["Locality", family.locality ?? "—"],
                ["House note", family.house_note ?? "—"],
                ["Record source", family.completeness?.source ?? "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
                  <dd className="text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>
          </FormCard>

          {(family.code_history ?? []).length > 0 && (
            <FormCard
              title="Previous codes"
              description="A paper record marked with one of these belongs to this family, not to whoever holds that code today."
            >
              <ul className="space-y-1 text-sm font-mono">
                {family.code_history.map((c, i) => (
                  <li key={`${c.code}-${i}`}>{c.code}</li>
                ))}
              </ul>
            </FormCard>
          )}

          {family.notes && (
            <FormCard title="Notes">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{family.notes}</p>
            </FormCard>
          )}

          {family.status === "active" && (
            <PermissionGate permission={P.family.close}>
              <FormCard title="Close this family">
                <p className="text-xs text-slate-500">
                  Closing releases position {family.serial_in_anbiyam} in {anbiyam?.code ?? "this Anbiyam"}.
                  The next household added there will be issued this same code.
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["transferred_out", "closed", "merged"] as const).map((status) => (
                    <ConfirmDialog
                      key={status}
                      trigger={
                        <button
                          className="px-3 py-2 rounded-lg border text-xs font-bold"
                          style={{ borderColor: "#e2e8f0", color: "#dc2626" }}
                        >
                          {status.replace("_", " ")}
                        </button>
                      }
                      title={`Mark ${family.family_code} as ${status.replace("_", " ")}?`}
                      message={`The record is kept and its history stays readable, but ${family.family_code} becomes free for the next family in this Anbiyam.`}
                      confirmLabel="Confirm"
                      requireTyping={family.family_code}
                      onConfirm={async () => {
                        const res = await close.mutateAsync({ status });
                        if (!res.success) setError(res.message);
                      }}
                    />
                  ))}
                </div>
              </FormCard>
            </PermissionGate>
          )}
        </div>
      </div>
    </PageShell>
  );
}

/** Split so the delete hook is only mounted for users who can act on it. */
function PermissionGateMemberRow({ m, familyId }: { m: Member; familyId: string }) {
  return (
    <PermissionGate
      permission={P.member.delete}
      fallback={<MemberRow m={m} familyId={familyId} canEdit={false} />}
    >
      <MemberRow m={m} familyId={familyId} canEdit />
    </PermissionGate>
  );
}
