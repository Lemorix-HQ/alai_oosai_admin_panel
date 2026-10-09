"use client";

import { DateInput, Field, Select, TamilTextArea, TamilTextInput, TextInput } from "@/components/ui/Field";
import LookupCombobox from "@/components/ui/LookupCombobox";
import {
  COMMON_COUNTRIES,
  MARITAL_LABEL,
  MEMBER_STATUS_LABEL,
  OCCUPATION_INDUSTRY_LABEL,
  RELATIONSHIP_LABEL,
} from "@/src/lib/domain-labels";
import {
  MEMBER_RELATIONSHIPS,
  type Member,
  type MemberCollege,
  type MemberRelationship,
  type MemberSchooling,
  type MemberWork,
} from "@/src/types";
import type { MemberPayload } from "@/actions/families.actions";

/**
 * One activity block as the form holds it.
 *
 * `on` is the toggle: off means the block is absent, and the payload sends an
 * explicit null so the server clears a block that used to be there. The
 * `*_label` fields exist because the combobox's search results only contain
 * what the current term matches — without them an edit form would open
 * looking empty even though a school is set.
 */
export interface ActivityValues {
  on: boolean;
  lookup_id: string | null;
  lookup_label: string | null;
  place_id: string | null;
  place_label: string | null;
  as_of_year: string;
  standard: string;
  course_year: string;
  degree: string;
}

export function emptyActivity(): ActivityValues {
  return {
    on: false,
    lookup_id: null,
    lookup_label: null,
    place_id: null,
    place_label: null,
    as_of_year: String(new Date().getFullYear()),
    standard: "",
    course_year: "",
    degree: "",
  };
}

type AnyRef = string | { _id: string; name?: string; name_ta?: string } | null | undefined;
const refId = (r: AnyRef) => (!r ? null : typeof r === "string" ? r : r._id);
const refLabel = (r: AnyRef) =>
  !r || typeof r === "string" ? null : r.name_ta || r.name || null;

/** The year a block was true; falls back to this year rather than sending NaN. */
function yearOf(a: ActivityValues): number {
  return Number(a.as_of_year) || new Date().getFullYear();
}

function schoolingToValues(b: Member["schooling"]): ActivityValues {
  if (!b) return emptyActivity();
  const s = b as MemberSchooling;
  return {
    ...emptyActivity(),
    on: true,
    lookup_id: refId(s.school_id),
    lookup_label: refLabel(s.school_id),
    place_id: refId(s.place_id),
    place_label: refLabel(s.place_id),
    standard: s.standard ?? "",
    as_of_year: String(s.as_of_year ?? new Date().getFullYear()),
  };
}

function collegeToValues(b: Member["college"]): ActivityValues {
  if (!b) return emptyActivity();
  const c = b as MemberCollege;
  return {
    ...emptyActivity(),
    on: true,
    lookup_id: refId(c.college_id),
    lookup_label: refLabel(c.college_id),
    place_id: refId(c.place_id),
    place_label: refLabel(c.place_id),
    course_year: c.course_year ? String(c.course_year) : "",
    degree: c.degree ?? "",
    as_of_year: String(c.as_of_year ?? new Date().getFullYear()),
  };
}

function workToValues(b: Member["work"]): ActivityValues {
  if (!b) return emptyActivity();
  const w = b as MemberWork;
  return {
    ...emptyActivity(),
    on: true,
    lookup_id: refId(w.occupation_id),
    lookup_label: refLabel(w.occupation_id),
    place_id: refId(w.place_id),
    place_label: refLabel(w.place_id),
    as_of_year: String(w.as_of_year ?? new Date().getFullYear()),
  };
}

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
  schooling: ActivityValues;
  college: ActivityValues;
  work: ActivityValues;
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
    schooling: emptyActivity(), college: emptyActivity(), work: emptyActivity(),
    phone: "", blood_group: "", notes: "",
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
    schooling: schoolingToValues(m.schooling),
    college: collegeToValues(m.college),
    work: workToValues(m.work),
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
    // A block that is off sends explicit null, which is how the server is
    // told to remove one that was there before. `undefined` would be dropped
    // by JSON.stringify and the old block would survive.
    schooling: v.schooling.on && v.schooling.lookup_id
      ? {
          school_id: v.schooling.lookup_id,
          standard: t(v.schooling.standard),
          place_id: v.schooling.place_id ?? undefined,
          as_of_year: yearOf(v.schooling),
        }
      : null,
    college: v.college.on && v.college.lookup_id
      ? {
          college_id: v.college.lookup_id,
          course_year: Number(v.college.course_year) || undefined,
          degree: t(v.college.degree),
          place_id: v.college.place_id ?? undefined,
          as_of_year: yearOf(v.college),
        }
      : null,
    work: v.work.on && v.work.lookup_id
      ? {
          occupation_id: v.work.lookup_id,
          place_id: v.work.place_id ?? undefined,
          as_of_year: yearOf(v.work),
        }
      : null,
    phone: t(v.phone),
    blood_group: t(v.blood_group),
    notes: t(v.notes),
    status: v.status,
  };
}

/**
 * A block that is switched on but has nothing picked.
 *
 * Without this the save succeeds and the block is silently dropped — and on an
 * edit form it is worse, because "on but nothing picked" and "off" both send
 * null, so it ERASES what was already recorded. Typing a name into the
 * combobox without tapping the `+ Add` row is the ordinary way to land here.
 */
export function memberActivityError(v: MemberValues): string | null {
  const needs = {
    schooling: ["At school", "school"],
    college: ["At college", "college"],
    work: ["Working", "occupation"],
  } as const;
  for (const k of ["schooling", "college", "work"] as const) {
    if (v[k].on && !v[k].lookup_id) {
      const [section, thing] = needs[k];
      return `“${section}” is switched on but no ${thing} is chosen. Pick one from the list, add it, or switch the section off.`;
    }
  }
  return null;
}

export function memberNameError(v: MemberValues): string | null {
  return !v.name.trim() && !v.name_ta.trim() ? "A name is required — Tamil or English." : null;
}

/**
 * The fields of a person, in one place.
 *
 * `compact` is the door-step form: a faculty member standing in someone's
 * front room needs the name, who they are and how old — not their baptismal
 * name. The full form is the same fields with the rest shown, so the two
 * cannot drift apart as the schema changes.
 *
 * The three activity blocks appear in BOTH modes but start collapsed, so the
 * door-step form stays short unless the family volunteers the information.
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
        <Field label="Name in Tamil" lang="tamil">
          <TamilTextInput value={v.name_ta} onChange={(e) => set({ name_ta: e.target.value })} />
        </Field>
        <Field label="Name in English" lang="english">
          <TextInput value={v.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>

        {!compact && (
          <>
            <Field label="Baptismal name" lang="tamil">
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
          <DateInput
            value={v.date_of_birth}
            onValueChange={(iso) => set({ date_of_birth: iso })}
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

      {/* Schooling, college and work.

          Rendered in BOTH modes, unlike the free-text fields they replace:
          faculty were explicitly asked for these at the door. They start
          collapsed so the door-step form stays as short as it was unless the
          family actually volunteers the information. */}
      {(["schooling", "college", "work"] as const).map((k) => {
        const a = v[k];
        const label = k === "schooling" ? "At school" : k === "college" ? "At college" : "Working";
        const lookupKind = k === "schooling" ? "school" : k === "college" ? "college" : "occupation";
        return (
          <div key={k} className="border-t pt-3" style={{ borderColor: "#e2e8f0" }}>
            <label
              className="flex items-center gap-2 text-sm font-bold"
              style={{ color: "#0D5C63" }}
            >
              <input
                type="checkbox"
                checked={a.on}
                onChange={(e) => set({ [k]: { ...a, on: e.target.checked } } as Partial<MemberValues>)}
              />
              {label}
            </label>

            {a.on && (
              <div className={`mt-3 ${compact ? "space-y-3" : "grid sm:grid-cols-2 gap-4"}`}>
                <Field label={k === "work" ? "Occupation" : k === "college" ? "College" : "School"}>
                  <LookupCombobox
                    kind={lookupKind}
                    value={a.lookup_id}
                    valueLabel={a.lookup_label}
                    onChange={(id, row) =>
                      set({
                        [k]: {
                          ...a,
                          lookup_id: id,
                          lookup_label: row ? row.name_ta || row.name : null,
                        },
                      } as Partial<MemberValues>)
                    }
                    createDefaults={k === "work" ? { industry: "other" } : {}}
                    // Asked for at the moment of adding: there is no way to
                    // edit a lookup entry later, so an occupation added at a
                    // door without its industry is wrong permanently.
                    createChoice={
                      k === "work"
                        ? {
                            key: "industry",
                            label: "Industry",
                            options: Object.entries(OCCUPATION_INDUSTRY_LABEL).map(
                              ([value, label]) => ({ value, label }),
                            ),
                          }
                        : undefined
                    }
                    placeholder="Search, or type a new name…"
                  />
                </Field>

                {k === "schooling" && (
                  <Field label="Standard">
                    <TextInput
                      value={a.standard}
                      onChange={(e) => set({ schooling: { ...a, standard: e.target.value } })}
                    />
                  </Field>
                )}

                {k === "college" && (
                  <>
                    <Field label="Year of course">
                      <TextInput
                        value={a.course_year}
                        onChange={(e) => set({ college: { ...a, course_year: e.target.value } })}
                      />
                    </Field>
                    <Field label="Degree">
                      <TextInput
                        value={a.degree}
                        onChange={(e) => set({ college: { ...a, degree: e.target.value } })}
                      />
                    </Field>
                  </>
                )}

                <Field label={k === "work" ? "Place of working" : "Place"}>
                  <LookupCombobox
                    kind="place"
                    value={a.place_id}
                    valueLabel={a.place_label}
                    onChange={(id, row) =>
                      set({
                        [k]: {
                          ...a,
                          place_id: id,
                          place_label: row ? row.name_ta || row.name : null,
                        },
                      } as Partial<MemberValues>)
                    }
                    createDefaults={{ kind: "town" }}
                    createChoice={{
                      key: "country",
                      label: "Country",
                      options: COMMON_COUNTRIES.map((c) => ({ value: c, label: c })),
                    }}
                    placeholder="Search, or type a new place…"
                  />
                </Field>

                <Field
                  label="Recorded for year"
                  hint="The year this was true. A standard without its year is wrong within twelve months."
                >
                  <TextInput
                    value={a.as_of_year}
                    onChange={(e) =>
                      set({ [k]: { ...a, as_of_year: e.target.value } } as Partial<MemberValues>)
                    }
                  />
                </Field>
              </div>
            )}
          </div>
        );
      })}

      <Field label="Notes" lang="tamil">
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
