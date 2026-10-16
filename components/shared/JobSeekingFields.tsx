"use client";

import { Field, TextInput } from "@/components/ui/Field";
import LookupCombobox from "@/components/ui/LookupCombobox";
import type { LookupAudience } from "@/actions/lookups.actions";
import type {
  HouseholdJobSeekingCollegeInput,
  HouseholdJobSeekingInput,
  HouseholdJobSeekingSchoolInput,
  MemberJobSeeking,
} from "@/src/types";

/**
 * "Waiting for Job Opportunities" — the toggle, and the optional 10th, 12th
 * and college details underneath it.
 *
 * Shared between the staff form (`MemberFields.tsx`) and the public
 * self-service form (`HouseholdMemberFields.tsx`) rather than duplicated:
 * both need the identical fields, wired to a different `audience` so
 * `LookupCombobox` hits the staff `/schools` route or the public
 * `/self-service/lookups/school` one.
 *
 * A reference the snapshot populated, or the bare id if it did not — the
 * same shape `MemberFields.tsx`/`HouseholdMemberFields.tsx` already use for
 * `schooling`/`college`.
 */
type AnyRef = string | { _id: string; name?: string; name_ta?: string } | null | undefined;
const refId = (r: AnyRef) => (!r ? null : typeof r === "string" ? r : r._id);
const refLabel = (r: AnyRef) => (!r || typeof r === "string" ? null : r.name_ta || r.name || null);

export interface JobSeekingSchoolDraft {
  lookup_id: string | null;
  lookup_label: string | null;
  percentage: string;
  place_id: string | null;
  place_label: string | null;
}

export interface JobSeekingCollegeDraft extends JobSeekingSchoolDraft {
  degree: string;
}

export interface JobSeekingDraft {
  is_seeking_job: boolean;
  tenth: JobSeekingSchoolDraft;
  twelfth: JobSeekingSchoolDraft;
  college: JobSeekingCollegeDraft;
}

function emptySchoolDraft(): JobSeekingSchoolDraft {
  return { lookup_id: null, lookup_label: null, percentage: "", place_id: null, place_label: null };
}

export function emptyJobSeekingDraft(): JobSeekingDraft {
  return {
    is_seeking_job: false,
    tenth: emptySchoolDraft(),
    twelfth: emptySchoolDraft(),
    college: { ...emptySchoolDraft(), degree: "" },
  };
}

function schoolDraftFrom(b: { school_id?: AnyRef; percentage?: number; place_id?: AnyRef } | null | undefined): JobSeekingSchoolDraft {
  if (!b) return emptySchoolDraft();
  return {
    lookup_id: refId(b.school_id),
    lookup_label: refLabel(b.school_id),
    percentage: b.percentage != null ? String(b.percentage) : "",
    place_id: refId(b.place_id),
    place_label: refLabel(b.place_id),
  };
}

export function jobSeekingDraftFrom(j: MemberJobSeeking | null | undefined): JobSeekingDraft {
  if (!j) return emptyJobSeekingDraft();
  const college = j.college;
  return {
    is_seeking_job: j.is_seeking_job ?? false,
    tenth: schoolDraftFrom(j.tenth),
    twelfth: schoolDraftFrom(j.twelfth),
    college: {
      lookup_id: refId(college?.college_id),
      lookup_label: refLabel(college?.college_id),
      percentage: college?.percentage != null ? String(college.percentage) : "",
      place_id: refId(college?.place_id),
      place_label: refLabel(college?.place_id),
      degree: college?.degree ?? "",
    },
  };
}

const numOrUndefined = (s: string) => (s.trim() && !Number.isNaN(Number(s)) ? Number(s) : undefined);

function schoolPayload(d: JobSeekingSchoolDraft): HouseholdJobSeekingSchoolInput | null {
  if (!d.lookup_id && !d.percentage.trim() && !d.place_id) return null;
  return {
    ...(d.lookup_id ? { school_id: d.lookup_id } : {}),
    ...(numOrUndefined(d.percentage) !== undefined ? { percentage: numOrUndefined(d.percentage) } : {}),
    ...(d.place_id ? { place_id: d.place_id } : {}),
  };
}

function collegePayload(d: JobSeekingCollegeDraft): HouseholdJobSeekingCollegeInput | null {
  if (!d.lookup_id && !d.percentage.trim() && !d.place_id && !d.degree.trim()) return null;
  return {
    ...(d.lookup_id ? { college_id: d.lookup_id } : {}),
    ...(d.degree.trim() ? { degree: d.degree.trim() } : {}),
    ...(numOrUndefined(d.percentage) !== undefined ? { percentage: numOrUndefined(d.percentage) } : {}),
    ...(d.place_id ? { place_id: d.place_id } : {}),
  };
}

/**
 * `null` when there is genuinely nothing to say — toggle off and every
 * sub-block empty — so an untouched block does not overwrite what is on
 * the record. The same `null`-means-clear rule `schooling`/`college` follow.
 */
export function jobSeekingPayload(d: JobSeekingDraft): HouseholdJobSeekingInput | null {
  const tenth = schoolPayload(d.tenth);
  const twelfth = schoolPayload(d.twelfth);
  const college = collegePayload(d.college);
  if (!d.is_seeking_job && !tenth && !twelfth && !college) return null;
  return { is_seeking_job: d.is_seeking_job, tenth, twelfth, college };
}

/** For change-detection on the self-service form: everything that matters, stringified. */
export function jobSeekingCore(d: JobSeekingDraft): string | null {
  const p = jobSeekingPayload(d);
  return p ? JSON.stringify(p) : null;
}

/**
 * Tamil only for the household's own form, matching the convention already
 * split between the two forms: the staff form's generic activity blocks stay
 * plain English, the self-service ones are Tamil-first. Not checked by a
 * Tamil speaker, same caveat this repo already carries for the rest of the
 * self-service form's Tamil.
 */
const LABEL = {
  toggle: { staff: "Waiting for job opportunities", household: "வேலை வாய்ப்புக்காக காத்திருக்கிறார் (Waiting for a job)" },
  hint: {
    staff: "Everything below is optional — fill in whatever is known.",
    household: "கீழே உள்ளவை அனைத்தும் விருப்பத்தின் பேரில் — தெரிந்ததை மட்டும் நிரப்பலாம்.",
  },
  tenth: { staff: "10th standard", household: "10ஆம் வகுப்பு (10th standard)" },
  twelfth: { staff: "12th standard", household: "12ஆம் வகுப்பு (12th standard)" },
  college: { staff: "College (if any)", household: "கல்லூரி — இருந்தால் (College, if any)" },
  school: { staff: "School", household: "பள்ளி (School)" },
  markPct: { staff: "Mark %", household: "மதிப்பெண் % (Mark %)" },
  place: { staff: "Place", household: "இடம் (Place)" },
  collegeName: { staff: "College", household: "கல்லூரி (College)" },
  degree: { staff: "Degree", household: "படிப்பு (Degree)" },
} as const;
const t = (k: keyof typeof LABEL, audience: LookupAudience) => LABEL[k][audience === "household" ? "household" : "staff"];

function SchoolBlock({
  title,
  value,
  onChange,
  audience,
}: {
  title: string;
  value: JobSeekingSchoolDraft;
  onChange: (next: JobSeekingSchoolDraft) => void;
  audience: LookupAudience;
}) {
  return (
    <div className="rounded-lg border p-3 mb-3">
      <p className="text-xs font-bold mb-2 text-slate-500">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label={t("school", audience)}>
          <LookupCombobox
            kind="school"
            value={value.lookup_id}
            valueLabel={value.lookup_label}
            audience={audience}
            onChange={(id, row) => onChange({ ...value, lookup_id: id, lookup_label: row?.name_ta || row?.name || null })}
          />
        </Field>
        <Field label={t("markPct", audience)}>
          <TextInput
            type="number"
            min={0}
            max={100}
            value={value.percentage}
            onChange={(e) => onChange({ ...value, percentage: e.target.value })}
          />
        </Field>
        <Field label={t("place", audience)}>
          <LookupCombobox
            kind="place"
            value={value.place_id}
            valueLabel={value.place_label}
            audience={audience}
            onChange={(id, row) => onChange({ ...value, place_id: id, place_label: row?.name_ta || row?.name || null })}
          />
        </Field>
      </div>
    </div>
  );
}

export default function JobSeekingFields({
  value,
  onChange,
  audience = "staff",
}: {
  value: JobSeekingDraft;
  onChange: (next: JobSeekingDraft) => void;
  audience?: LookupAudience;
}) {
  return (
    <div className="rounded-lg border p-4 mb-4">
      <label className="flex items-center gap-2 text-sm font-bold">
        <input
          type="checkbox"
          checked={value.is_seeking_job}
          onChange={(e) => onChange({ ...value, is_seeking_job: e.target.checked })}
        />
        {t("toggle", audience)}
      </label>

      {value.is_seeking_job && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-3">
            {t("hint", audience)}
          </p>
          <SchoolBlock
            title={t("tenth", audience)}
            value={value.tenth}
            onChange={(tenth) => onChange({ ...value, tenth })}
            audience={audience}
          />
          <SchoolBlock
            title={t("twelfth", audience)}
            value={value.twelfth}
            onChange={(twelfth) => onChange({ ...value, twelfth })}
            audience={audience}
          />
          <div className="rounded-lg border p-3">
            <p className="text-xs font-bold mb-2 text-slate-500">{t("college", audience)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Field label={t("collegeName", audience)}>
                <LookupCombobox
                  kind="college"
                  value={value.college.lookup_id}
                  valueLabel={value.college.lookup_label}
                  audience={audience}
                  onChange={(id, row) =>
                    onChange({
                      ...value,
                      college: { ...value.college, lookup_id: id, lookup_label: row?.name_ta || row?.name || null },
                    })
                  }
                />
              </Field>
              <Field label={t("degree", audience)}>
                <TextInput
                  value={value.college.degree}
                  onChange={(e) => onChange({ ...value, college: { ...value.college, degree: e.target.value } })}
                />
              </Field>
              <Field label={t("markPct", audience)}>
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  value={value.college.percentage}
                  onChange={(e) => onChange({ ...value, college: { ...value.college, percentage: e.target.value } })}
                />
              </Field>
              <Field label={t("place", audience)}>
                <LookupCombobox
                  kind="place"
                  value={value.college.place_id}
                  valueLabel={value.college.place_label}
                  audience={audience}
                  onChange={(id, row) =>
                    onChange({
                      ...value,
                      college: { ...value.college, place_id: id, place_label: row?.name_ta || row?.name || null },
                    })
                  }
                />
              </Field>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
