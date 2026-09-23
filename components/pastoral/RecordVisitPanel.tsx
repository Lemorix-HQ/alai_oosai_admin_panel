"use client";

import { useState } from "react";
import SlideOver from "@/components/ui/SlideOver";
import StatusPill from "@/components/ui/StatusPill";
import { Field, FormActions, Select, TamilTextArea, TextInput } from "@/components/ui/Field";
import MemberFields, {
  emptyMember,
  memberNameError,
  memberToValues,
  valuesToPayload,
  type MemberValues,
} from "@/components/families/MemberFields";
import { PermissionGate } from "@/src/session/PermissionGate";
import { P } from "@/src/session/permissions";
import { useAddMember, useFamily, useUpdateMember } from "@/hooks/useFamilies";
import { useRecordVisit } from "@/hooks/usePastoral";
import {
  MEMBER_STATUS_LABEL,
  RELATIONSHIP_LABEL,
  VISIT_OUTCOME_LABEL,
  ageFrom,
} from "@/src/lib/domain-labels";
import type { Member, VisitOutcome } from "@/src/types";

export interface VisitTarget {
  _id: string;
  family_code: string;
  locality?: string;
  primary_phone?: string;
}

type Editing = { mode: "add" } | { mode: "edit"; member: Member } | null;

/**
 * One family's door step.
 *
 * The household comes first and the visit second, because that is the order it
 * happens in: the faculty member stands in the front room, finds three children
 * nobody entered, adds them, and only then says the record is right. Sending
 * them to another screen to add a person loses the visit they were recording.
 */
export default function RecordVisitPanel({
  roundId,
  family,
  onClose,
}: {
  roundId: string;
  family: VisitTarget | null;
  onClose: () => void;
}) {
  const familyId = family?._id ?? "";
  const { data, isLoading } = useFamily(familyId);
  const addMember = useAddMember(familyId);
  const updateMember = useUpdateMember(familyId);
  const record = useRecordVisit();

  const [editing, setEditing] = useState<Editing>(null);
  const [mv, setMv] = useState<MemberValues>(emptyMember());
  const [memberError, setMemberError] = useState<string | null>(null);

  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [outcome, setOutcome] = useState<VisitOutcome>("verified");
  const [membersComplete, setMembersComplete] = useState(true);
  const [acknowledgement, setAcknowledgement] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const members = (data?.data?.members ?? []).filter((m) => !m.is_deleted);

  function startAdd() {
    setMv(emptyMember());
    setMemberError(null);
    setEditing({ mode: "add" });
  }

  function startEdit(m: Member) {
    setMv(memberToValues(m));
    setMemberError(null);
    setEditing({ mode: "edit", member: m });
  }

  async function saveMember() {
    const nameError = memberNameError(mv);
    if (nameError) return setMemberError(nameError);
    setMemberError(null);

    const payload = valuesToPayload(mv);
    const res =
      editing?.mode === "edit"
        ? await updateMember.mutateAsync({ id: editing.member._id, payload })
        : await addMember.mutateAsync(payload);

    if (!res.success) setMemberError(res.message);
    else setEditing(null);
  }

  async function submitVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!family) return;
    setError(null);

    const res = await record.mutateAsync({
      family_id: family._id,
      round_id: roundId,
      visit_date: new Date(visitDate).toISOString(),
      outcome,
      members_complete: outcome === "verified" ? membersComplete : undefined,
      acknowledgement: acknowledgement.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (!res.success) return setError(res.message);
    setAcknowledgement("");
    setNotes("");
    setEditing(null);
    onClose();
  }

  return (
    <SlideOver
      open={Boolean(family)}
      title={family ? family.family_code : "Record visit"}
      description={
        family ? [family.locality, family.primary_phone].filter(Boolean).join(" · ") : undefined
      }
      onClose={onClose}
    >
      <section className="mb-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Household {members.length > 0 && `(${members.length})`}
          </h3>
          {!editing && (
            <PermissionGate permission={P.member.create}>
              <button
                type="button"
                onClick={startAdd}
                className="text-sm font-bold py-1.5 px-3 rounded-lg border"
                style={{ color: "#0D5C63", borderColor: "#cbd5e1" }}
              >
                + Add a person
              </button>
            </PermissionGate>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading the household…</p>
        ) : (
          <ul className="rounded-lg border divide-y" style={{ borderColor: "#e2e8f0" }}>
            {members.length === 0 && (
              <li className="p-3 text-sm text-slate-500">
                Nobody is on this card yet.
              </li>
            )}
            {members.map((m) => {
              const age = ageFrom(m.date_of_birth);
              return (
                <li key={m._id} className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "#0D5C63" }}>
                      {m.name_ta || m.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {RELATIONSHIP_LABEL[m.relationship_to_head] ?? m.relationship_to_head}
                      {" · "}
                      {m.gender === "male" ? "M" : "F"}
                      {age !== null && ` · ${age}${m.dob_is_estimated ? "≈" : ""}`}
                      {m.status !== "active" && ` · ${MEMBER_STATUS_LABEL[m.status] ?? m.status}`}
                    </p>
                  </div>
                  {!editing && (
                    <PermissionGate permission={P.member.update}>
                      <button
                        type="button"
                        onClick={() => startEdit(m)}
                        className="text-xs font-bold shrink-0"
                        style={{ color: "#0D5C63" }}
                      >
                        Edit
                      </button>
                    </PermissionGate>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {editing && (
          <div className="mt-3 rounded-lg border p-3" style={{ borderColor: "#0D5C63" }}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {editing.mode === "add" ? "New person" : `Editing ${editing.member.name_ta || editing.member.name}`}
            </p>
            <div className="space-y-3">
              <MemberFields v={mv} setV={setMv} compact showStatus={editing.mode === "edit"} />
              {memberError && <p className="text-sm font-medium text-red-700">{memberError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveMember}
                  disabled={addMember.isPending || updateMember.isPending}
                  className="font-bold py-2 px-4 rounded-lg text-sm disabled:opacity-50"
                  style={{ backgroundColor: "#0D5C63", color: "white" }}
                >
                  {editing.mode === "add" ? "Add to household" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="font-bold py-2 px-4 rounded-lg text-sm border"
                  style={{ borderColor: "#cbd5e1" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <form onSubmit={submitVisit} className="space-y-4 border-t pt-5" style={{ borderColor: "#e2e8f0" }}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">The visit</h3>

        <Field label="Date of visit" required>
          <TextInput type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
        </Field>

        <Field label="Outcome" required>
          <Select value={outcome} onChange={(e) => setOutcome(e.target.value as VisitOutcome)}>
            {Object.entries(VISIT_OUTCOME_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        {outcome === "verified" && (
          <Field label="Member list">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={membersComplete}
                onChange={(e) => setMembersComplete(e.target.checked)}
              />
              <span>
                All {members.length} {members.length === 1 ? "person" : "people"} in this household
                are on the card
              </span>
            </label>
          </Field>
        )}

        <Field
          label="Acknowledged by"
          hint="The passbook's கையொப்பம் column — who at the house acknowledged the visit."
        >
          <TextInput value={acknowledgement} onChange={(e) => setAcknowledgement(e.target.value)} />
        </Field>

        <Field label="Notes">
          <TamilTextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        {editing && (
          <StatusPill
            label="Finish or cancel the person above first"
            tone="warning"
            icon="edit"
          />
        )}

        <FormActions
          submitting={record.isPending}
          submitLabel="Record visit"
          error={error}
          onCancel={onClose}
        />
      </form>
    </SlideOver>
  );
}
