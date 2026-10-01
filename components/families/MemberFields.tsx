"use client";

import { Field, Select, TamilTextArea, TamilTextInput, TextInput } from "@/components/ui/Field";
import { MARITAL_LABEL, MEMBER_STATUS_LABEL, RELATIONSHIP_LABEL } from "@/src/lib/domain-labels";
import { MEMBER_RELATIONSHIPS, type Member, type MemberRelationship } from "@/src/types";
import type { MemberPayload } from "@/actions/families.actions";

export interface MemberValues {
  name: string;
  name_ta: string;
  baptismal_name: string;
  initial: string;
  gender: "male" | "female";
  relationship_to_head: MemberRelationship;
  date_of_birth: string;
  dob_is_estimated: boolean;
  marital_status: string;
  occupation: string;
  education: string;
  phone: string;
  blood_group: string;
  notes: string;
  status: string;
}

export function emptyMember(overrides: Partial<MemberValues> = {}): MemberValues {
  return {
    name: "", name_ta: "", baptismal_name: "", initial: "",
    gender: "male", relationship_to_head: "magan",
    date_of_birth: "", dob_is_estimated: false, marital_status: "unknown",
    occupation: "", education: "", phone: "", blood_group: "", notes: "",
    status: "active",
    ...overrides,
  };
}

export function memberToValues(m: Member): MemberValues {
  return emptyMember({
    name: m.name ?? "",
    name_ta: m.name_ta ?? "",
    baptismal_name: m.baptismal_name ?? "",
    initial: m.initial ?? "",
    gender: (m.gender as "male" | "female") ?? "male",
    relationship_to_head: m.relationship_to_head,
    date_of_birth: m.date_of_birth ? String(m.date_of_birth).slice(0, 10) : "",
    dob_is_estimated: Boolean(m.dob_is_estimated),
    marital_status: m.marital_status ?? "unknown",
    occupation: m.occupation ?? "",
    education: m.education ?? "",
    phone: m.phone ?? "",
    blood_group: m.blood_group ?? "",
    notes: m.notes ?? "",
    status: m.status ?? "active",
  });
}

/** Trims, drops the empties, and converts the date. Never sends an age. */
export function valuesToPayload(v: MemberValues): MemberPayload & { status?: string } {
  const t = (s: string) => s.trim() || undefined;
  return {
    name: v.name.trim() || v.name_ta.trim(),
    name_ta: t(v.name_ta),
    baptismal_name: t(v.baptismal_name),
    initial: t(v.initial),
    gender: v.gender,
    relationship_to_head: v.relationship_to_head,
    date_of_birth: v.date_of_birth ? new Date(v.date_of_birth).toISOString() : undefined,
    dob_is_estimated: v.dob_is_estimated,
    marital_status: v.marital_status,
    occupation: t(v.occupation),
    education: t(v.education),
    phone: t(v.phone),
    blood_group: t(v.blood_group),
    notes: t(v.notes),
    status: v.status,
  };
}

export function memberNameError(v: MemberValues): string | null {
  return !v.name.trim() && !v.name_ta.trim() ? "A name is required — Tamil or English." : null;
}

/**
 * The fields of a person, in one place.
 *
 * `compact` is the door-step form: a faculty member standing in someone's
 * front room needs the name, who they are and how old — not their education.
 * The full form is the same fields with the rest shown, so the two cannot
 * drift apart as the schema changes.
 */
export default function MemberFields({
  v,
  setV,
  compact = false,
  showStatus = false,
}: {
  v: MemberValues;
  setV: (next: MemberValues) => void;
  compact?: boolean;
  showStatus?: boolean;
}) {
  const set = (patch: Partial<MemberValues>) => setV({ ...v, ...patch });

  return (
    <>
      <div className={compact ? "space-y-3" : "grid sm:grid-cols-2 gap-4"}>
        <Field label="Name in Tamil">
          <TamilTextInput value={v.name_ta} onChange={(e) => set({ name_ta: e.target.value })} />
        </Field>
        <Field label="Name in English">
          <TextInput value={v.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>

        {!compact && (
          <>
            <Field label="Baptismal name">
              <TamilTextInput
                value={v.baptismal_name}
                onChange={(e) => set({ baptismal_name: e.target.value })}
              />
            </Field>
            <Field label="Initial">
              <TextInput value={v.initial} onChange={(e) => set({ initial: e.target.value })} />
            </Field>
          </>
        )}

        <Field label="Gender" required>
          <Select
            value={v.gender}
            onChange={(e) => set({ gender: e.target.value as "male" | "female" })}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </Field>

        <Field label="Relationship to head" required>
          <Select
            value={v.relationship_to_head}
            onChange={(e) =>
              set({ relationship_to_head: e.target.value as MemberRelationship })
            }
          >
            {MEMBER_RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {RELATIONSHIP_LABEL[r] ?? r}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Date of birth"
          hint={compact ? "The age is computed from it — never stored." : undefined}
        >
          <TextInput
            type="date"
            value={v.date_of_birth}
            onChange={(e) => set({ date_of_birth: e.target.value })}
          />
        </Field>

        <Field label="Is the date an estimate?">
          <Select
            value={String(v.dob_is_estimated)}
            onChange={(e) => set({ dob_is_estimated: e.target.value === "true" })}
          >
            <option value="false">No — as recorded</option>
            <option value="true">Yes — worked back from an age</option>
          </Select>
        </Field>

        <Field label="Marital status">
          <Select
            value={v.marital_status}
            onChange={(e) => set({ marital_status: e.target.value })}
          >
            {Object.entries(MARITAL_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Phone">
          <TextInput value={v.phone} onChange={(e) => set({ phone: e.target.value })} />
        </Field>

        {!compact && (
          <>
            <Field label="Blood group">
              <TextInput
                value={v.blood_group}
                onChange={(e) => set({ blood_group: e.target.value })}
              />
            </Field>
            <Field label="Occupation">
              <TextInput
                value={v.occupation}
                onChange={(e) => set({ occupation: e.target.value })}
              />
            </Field>
            <Field label="Education">
              <TextInput value={v.education} onChange={(e) => set({ education: e.target.value })} />
            </Field>
          </>
        )}

        {showStatus && (
          <Field
            label="Status"
            hint="A death is recorded in the death register. This field is the projection of that entry, not a substitute for it."
          >
            <Select value={v.status} onChange={(e) => set({ status: e.target.value })}>
              {Object.entries(MEMBER_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      <Field label="Notes">
        <TamilTextArea rows={2} value={v.notes} onChange={(e) => set({ notes: e.target.value })} />
      </Field>

      {!compact && (
        <p className="text-xs text-slate-500">
          Baptism, communion, confirmation and marriage are register entries, not fields here.
        </p>
      )}
    </>
  );
}
