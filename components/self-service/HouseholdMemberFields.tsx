"use client";

import { DateInput, Field, Select, TamilTextInput, TextInput } from "@/components/ui/Field";
import LookupCombobox from "@/components/ui/LookupCombobox";
import { COMMON_COUNTRIES } from "@/src/lib/domain-labels";
import type {
  HouseholdCollegeInput, HouseholdMember, HouseholdMemberChanges,
  HouseholdSchoolingInput, HouseholdWorkInput, SubmitSittingPayload,
} from "@/src/types";

/**
 * The fields of a person, as the household itself fills them in.
 *
 * **Not `components/families/MemberFields.tsx`**, and not for want of trying.
 * Threading a `publicMode` flag through its 526 lines would couple the
 * parishioner's form to the staff form for good. So this is the narrower set a
 * household can answer about itself, Tamil first.
 *
 * It does carry schooling, college and work — the three blocks that name a row
 * on a parish-owned list. That took a route of their own: `LookupCombobox`
 * fetches `/schools`, `/colleges`, `/occupations` and `/places`, which all
 * require `member.read`, and nobody holds a permission on a public page. The
 * combobox itself is shared, pointed at `/self-service/lookups/:kind` with
 * `audience="household"`; everything fiddly about it — the delayed blur so a
 * tap lands, the "+ Add" row, keeping a picked label visible once the search
 * has moved on — is fiddlier on a phone and was not worth writing twice.
 *
 * The year is **not asked for**. `as_of_year` is required on the server for the
 * reason an age is never stored, but a household filling the form in is
 * describing now, so a block they touch is stamped with the current year and a
 * block they leave alone keeps the year it has.
 *
 * **The Tamil here has not been read by a Tamil speaker.** The kinship terms
 * come from `domain-labels.ts`, which took them from the parish's own passbook;
 * the rest — including the industry names below — are ordinary words and should
 * be checked before this goes in front of anybody.
 */

/** Tamil first, English after — the reverse of `domain-labels.ts`, which serves staff. */
export const RELATIONSHIP_TA: Record<string, string> = {
  head: "குடும்பத் தலைவர் (Head)",
  thunaivar: "துணைவர் (Husband)",
  thunaivi: "துணைவி (Wife)",
  magan: "மகன் (Son)",
  magal: "மகள் (Daughter)",
  marumagan: "மருமகன் (Son-in-law)",
  marumagal: "மருமகள் (Daughter-in-law)",
  peran: "பேரன் (Grandson)",
  petti: "பேத்தி (Granddaughter)",
  father: "தந்தை (Father)",
  mother: "தாய் (Mother)",
  brother: "சகோதரர் (Brother)",
  sister: "சகோதரி (Sister)",
  relative: "உறவினர் (Relative)",
  other: "மற்றவர் (Other)",
};

export const MARITAL_TA: Record<string, string> = {
  single: "திருமணமாகாதவர் (Single)",
  married: "திருமணமானவர் (Married)",
  widowed: "துணை இழந்தவர் (Widowed)",
  separated: "பிரிந்தவர் (Separated)",
  religious: "துறவு வாழ்வு (Religious)",
  unknown: "தெரியவில்லை (Not known)",
};

export const GENDER_TA: Record<string, string> = {
  male: "ஆண் (Male)",
  female: "பெண் (Female)",
};

/**
 * The industry an occupation belongs to, in Tamil.
 *
 * Asked at the moment of adding, exactly as the staff form asks it, and for the
 * same reason: there is no way to edit a lookup entry afterwards, so an
 * occupation added without its industry is mis-grouped in the priest's reports
 * permanently. The keys mirror `OCCUPATION_INDUSTRIES` in the backend.
 */
export const INDUSTRY_TA: Record<string, string> = {
  fishing: "மீன்பிடித் தொழில் (Fishing)",
  agriculture: "விவசாயம் (Agriculture)",
  construction: "கட்டுமானம் (Construction)",
  healthcare: "மருத்துவம் (Healthcare)",
  education: "கல்வி (Education)",
  government: "அரசுப் பணி (Government)",
  transport: "போக்குவரத்து (Transport)",
  retail: "கடை வணிகம் (Retail)",
  hospitality: "விடுதி, உணவு (Hospitality)",
  it_services: "தகவல் தொழில்நுட்பம் (IT and services)",
  manufacturing: "உற்பத்தி (Manufacturing)",
  domestic: "வீட்டுப் பணி (Domestic)",
  religious: "சபைப் பணி (Religious)",
  other: "மற்றவை (Other)",
};

/**
 * One of schooling, college and work, as the form holds it.
 *
 * `on` is the toggle; off sends an explicit `null`, which is how the server is
 * told to clear a block that used to be there. The `*_label` fields exist
 * because the combobox's search results hold only what the current term
 * matches — without them an open block would look empty though a school is set,
 * and the household would add a second row for the same school.
 *
 * `as_of_year` is carried but never shown: it holds the year already on record
 * so that an untouched block compares equal to itself, and a block that **is**
 * touched is restamped with the current year on the way out.
 */
export interface ActivityDraft {
  on: boolean;
  lookup_id: string | null;
  lookup_label: string | null;
  place_id: string | null;
  place_label: string | null;
  standard: string;
  course_year: string;
  degree: string;
  as_of_year: number;
}

export type ActivityKey = "schooling" | "college" | "work";

export function emptyActivity(): ActivityDraft {
  return {
    on: false,
    lookup_id: null,
    lookup_label: null,
    place_id: null,
    place_label: null,
    standard: "",
    course_year: "",
    degree: "",
    as_of_year: new Date().getFullYear(),
  };
}

/** The form's own shape: every value a string, so an input can own it. */
export interface MemberDraft {
  name_ta: string;
  name: string;
  relationship_to_head: string;
  gender: string;
  date_of_birth: string;
  marital_status: string;
  phone: string;
  email: string;
  blood_group: string;
  shares_household_phone: boolean;
  schooling: ActivityDraft;
  college: ActivityDraft;
  work: ActivityDraft;
}

export function emptyDraft(): MemberDraft {
  return {
    name_ta: "", name: "", relationship_to_head: "magan", gender: "male",
    date_of_birth: "", marital_status: "unknown", phone: "", email: "",
    blood_group: "", shares_household_phone: false,
    schooling: emptyActivity(), college: emptyActivity(), work: emptyActivity(),
  };
}

/** A reference the snapshot populated, or the bare id if it did not. */
type AnyRef = string | { _id: string; name?: string; name_ta?: string } | null | undefined;
const refId = (r: AnyRef) => (!r ? null : typeof r === "string" ? r : r._id);
const refLabel = (r: AnyRef) =>
  !r || typeof r === "string" ? null : r.name_ta || r.name || null;

function schoolingDraft(b: HouseholdMember["schooling"]): ActivityDraft {
  if (!b) return emptyActivity();
  return {
    ...emptyActivity(),
    on: true,
    lookup_id: refId(b.school_id),
    lookup_label: refLabel(b.school_id),
    place_id: refId(b.place_id),
    place_label: refLabel(b.place_id),
    standard: b.standard ?? "",
    as_of_year: b.as_of_year ?? new Date().getFullYear(),
  };
}

function collegeDraft(b: HouseholdMember["college"]): ActivityDraft {
  if (!b) return emptyActivity();
  return {
    ...emptyActivity(),
    on: true,
    lookup_id: refId(b.college_id),
    lookup_label: refLabel(b.college_id),
    place_id: refId(b.place_id),
    place_label: refLabel(b.place_id),
    course_year: b.course_year ? String(b.course_year) : "",
    degree: b.degree ?? "",
    as_of_year: b.as_of_year ?? new Date().getFullYear(),
  };
}

function workDraft(b: HouseholdMember["work"]): ActivityDraft {
  if (!b) return emptyActivity();
  return {
    ...emptyActivity(),
    on: true,
    lookup_id: refId(b.occupation_id),
    lookup_label: refLabel(b.occupation_id),
    place_id: refId(b.place_id),
    place_label: refLabel(b.place_id),
    as_of_year: b.as_of_year ?? new Date().getFullYear(),
  };
}

/** Tamil script anywhere in the string. */
const hasTamil = (s: string) => /[\u0B80-\u0BFF]/.test(s);

/**
 * Which box a name belongs in, which is not the same question as which column
 * it is stored in.
 *
 * The seeded census holds the passbook's Tamil name in `name` and `null` in
 * `name_ta` on all 3,225 members — `seed-parish.ts` reads `f.headTa` straight
 * into `name`, because `Member.name` is `required: true` and there was no
 * romanisation to put there. Taken at face value that opened the form with
 * Tamil sitting in the box marked "Name in English" and nothing in the box
 * marked Tamil: a household correcting its own spelling would be typing into
 * the wrong field, and the English name on the record would stay Tamil forever.
 *
 * So the script decides. Tamil in `name` is read as the Tamil name, and the
 * English box opens empty and waiting — which is what it is actually for. The
 * record itself is left alone: `name` is required, nothing here can clear it,
 * and `changesBetween` sees the empty English box as unchanged from the empty
 * English box it started with, so no request is raised over it.
 */
function namesOf(m: HouseholdMember): { name: string; name_ta: string } {
  const stored = m.name ?? "";
  if (hasTamil(stored)) return { name: "", name_ta: m.name_ta ?? stored };
  return { name: stored, name_ta: m.name_ta ?? "" };
}

export function draftFrom(m: HouseholdMember): MemberDraft {
  const { name, name_ta } = namesOf(m);
  return {
    name_ta,
    name,
    relationship_to_head: m.relationship_to_head,
    gender: m.gender,
    // `DateInput` holds ISO and shows dd/mm/yyyy; a stored timestamp has to
    // lose its clock half first.
    date_of_birth: m.date_of_birth ? m.date_of_birth.slice(0, 10) : "",
    marital_status: m.marital_status || "unknown",
    phone: m.phone ?? "",
    email: m.email ?? "",
    blood_group: m.blood_group ?? "",
    shares_household_phone: false,
    schooling: schoolingDraft(m.schooling),
    college: collegeDraft(m.college),
    work: workDraft(m.work),
  };
}

const trimmed = (s: string) => s.trim();

/**
 * A block in the shape the submit endpoint wants, or `null` for "not this".
 *
 * `null` rather than `undefined` on purpose: `JSON.stringify` drops undefined,
 * and the block already on the record would then survive a household switching
 * the section off. The same rule `valuesToPayload` follows on the staff form.
 */
function activityPayload(
  key: ActivityKey,
  a: ActivityDraft,
  year: number,
): HouseholdSchoolingInput | HouseholdCollegeInput | HouseholdWorkInput | null {
  if (!a.on || !a.lookup_id) return null;
  const place = a.place_id ?? undefined;
  if (key === "schooling") {
    return {
      school_id: a.lookup_id,
      ...(trimmed(a.standard) ? { standard: trimmed(a.standard) } : {}),
      ...(place ? { place_id: place } : {}),
      as_of_year: year,
    };
  }
  if (key === "college") {
    return {
      college_id: a.lookup_id,
      ...(Number(a.course_year) ? { course_year: Number(a.course_year) } : {}),
      ...(trimmed(a.degree) ? { degree: trimmed(a.degree) } : {}),
      ...(place ? { place_id: place } : {}),
      as_of_year: year,
    };
  }
  return {
    occupation_id: a.lookup_id,
    ...(place ? { place_id: place } : {}),
    as_of_year: year,
  };
}

/**
 * Everything about a block except its year.
 *
 * The year is deliberately left out of the comparison. A block the household
 * never opened would otherwise look changed the moment the calendar moved past
 * the year it was recorded in, and a change request would be raised for a fact
 * nobody touched.
 */
function activityCore(key: ActivityKey, a: ActivityDraft): string | null {
  const p = activityPayload(key, a, 0);
  return p ? JSON.stringify(p) : null;
}

/**
 * Only what actually changed.
 *
 * An edit the household did not make must not be sent: every field in the
 * payload becomes part of a change request somebody has to read at a front
 * door, and "name: the same name" is noise in a queue.
 */
export function changesBetween(before: MemberDraft, after: MemberDraft): HouseholdMemberChanges {
  const out: HouseholdMemberChanges = {};
  // The plain string fields only. The three activity blocks are objects and
  // are compared below — listing them here would let a string be assigned
  // where a block belongs.
  const keys = [
    "name", "name_ta", "relationship_to_head", "gender",
    "date_of_birth", "marital_status", "phone", "email", "blood_group",
  ] as const;
  for (const k of keys) {
    const a = trimmed(String(before[k] ?? ""));
    const b = trimmed(String(after[k] ?? ""));
    if (a !== b) out[k] = b;
  }

  // A block that was touched is restamped with this year: the household is
  // describing now, which is the whole meaning of `as_of_year`. One that was
  // not touched sends nothing at all and keeps the year it has.
  const thisYear = new Date().getFullYear();
  for (const k of ["schooling", "college", "work"] as const) {
    if (activityCore(k, before[k]) === activityCore(k, after[k])) continue;
    // null when the section was switched off — that is the removal.
    out[k] = activityPayload(k, after[k], thisYear) as never;
  }

  return out;
}

/** A new person, in the shape the submit endpoint wants. */
export type NewMemberPayload = NonNullable<SubmitSittingPayload["new_members"]>[number];

export function draftToNewMember(d: MemberDraft): NewMemberPayload {
  const out: NewMemberPayload = {
    // Either script is enough, and the backend falls back the same way.
    name: trimmed(d.name) || trimmed(d.name_ta),
    gender: d.gender,
    relationship_to_head: d.relationship_to_head,
  };
  if (trimmed(d.name_ta)) out.name_ta = trimmed(d.name_ta);
  if (d.date_of_birth) out.date_of_birth = d.date_of_birth;
  if (d.marital_status && d.marital_status !== "unknown") out.marital_status = d.marital_status;
  if (trimmed(d.phone)) out.phone = trimmed(d.phone);
  if (trimmed(d.email)) out.email = trimmed(d.email);
  if (trimmed(d.blood_group)) out.blood_group = trimmed(d.blood_group);
  if (d.shares_household_phone) out.shares_household_phone = true;

  // Omitted rather than sent as null: there is no previous block on somebody
  // who is not on the record yet, so there is nothing to clear.
  const thisYear = new Date().getFullYear();
  for (const k of ["schooling", "college", "work"] as const) {
    const block = activityPayload(k, d[k], thisYear);
    if (block) out[k] = block as never;
  }
  return out;
}

/**
 * A section switched on with nothing picked.
 *
 * This matters more here than on the staff form. "On but nothing picked" and
 * "off" both produce `null`, so without this check switching a section on,
 * typing a name and never tapping `+ சேர்` would **erase** the block already on
 * the record — a silent deletion dressed up as an edit.
 */
export function draftActivityError(d: MemberDraft): string | null {
  const asked: Record<ActivityKey, string> = {
    schooling: "பள்ளி (school)",
    college: "கல்லூரி (college)",
    work: "தொழில் (occupation)",
  };
  for (const k of ["schooling", "college", "work"] as const) {
    if (d[k].on && !d[k].lookup_id) {
      return `பட்டியலில் ${asked[k]} ஒன்றைத் தேர்ந்தெடுக்கவும், அல்லது அந்தப் பகுதியை நிறுத்தவும் — pick a ${asked[k]} from the list, add it with the “+” row, or switch that section off.`;
    }
  }
  return null;
}

/** A name in either script is enough — the backend falls back the same way. */
export function draftNameError(d: MemberDraft): string | null {
  if (!trimmed(d.name) && !trimmed(d.name_ta)) {
    return "பெயரை தமிழில் அல்லது ஆங்கிலத்தில் எழுதுங்கள் — Please write the name, in Tamil or English.";
  }
  return null;
}

export default function HouseholdMemberFields({
  v,
  setV,
  askPhone,
  minAge,
}: {
  v: MemberDraft;
  setV: (next: MemberDraft) => void;
  /** True once the date of birth says this person is old enough to need one. */
  askPhone: boolean;
  minAge: number;
}) {
  const set = (patch: Partial<MemberDraft>) => setV({ ...v, ...patch });

  return (
    <div className="space-y-3">
      <Field label="பெயர் — தமிழில் (Name in Tamil)">
        <TamilTextInput value={v.name_ta} onChange={(e) => set({ name_ta: e.target.value })} />
      </Field>

      <Field label="பெயர் — ஆங்கிலத்தில் (Name in English)">
        <TextInput value={v.name} onChange={(e) => set({ name: e.target.value })} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="குடும்ப உறவு (Relationship)" required>
          <Select
            value={v.relationship_to_head}
            onChange={(e) => set({ relationship_to_head: e.target.value })}
          >
            {Object.entries(RELATIONSHIP_TA).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="பாலினம் (Gender)" required>
          <Select value={v.gender} onChange={(e) => set({ gender: e.target.value })}>
            {Object.entries(GENDER_TA).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field
          label="பிறந்த தேதி (Date of birth)"
          hint={`வயது இதிலிருந்து கணக்கிடப்படும் — the age is worked out from this, never stored. From ${minAge} a phone number is asked for.`}
        >
          <DateInput
            value={v.date_of_birth}
            onValueChange={(iso) => set({ date_of_birth: iso })}
          />
        </Field>

        <Field label="திருமண நிலை (Marital status)">
          <Select value={v.marital_status} onChange={(e) => set({ marital_status: e.target.value })}>
            {Object.entries(MARITAL_TA).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="கைபேசி எண் (Mobile number)"
        required={askPhone && !v.shares_household_phone}
        hint={
          askPhone
            ? "செயலியில் உள்நுழைவதற்கு இந்த எண்ணே பயன்படும் — this number is how they will sign in to the app. One number belongs to one person."
            : undefined
        }
      >
        <TextInput
          value={v.phone}
          inputMode="numeric"
          disabled={v.shares_household_phone}
          onChange={(e) => set({ phone: e.target.value })}
        />
      </Field>

      {askPhone && (
        <label className="flex items-start gap-2 text-sm" style={{ color: "#596065" }}>
          <input
            type="checkbox"
            className="mt-1"
            checked={v.shares_household_phone}
            onChange={(e) =>
              set({ shares_household_phone: e.target.checked, phone: e.target.checked ? "" : v.phone })
            }
          />
          <span>
            இவருக்கு சொந்த எண் இல்லை, குடும்ப எண்ணையே பயன்படுத்துகிறார்
            <span className="block text-xs text-slate-500">
              This person has no number of their own and uses the household&apos;s.
            </span>
          </span>
        </label>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="மின்னஞ்சல் (Email)">
          <TextInput type="email" value={v.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>

        <Field label="இரத்தப் பிரிவு (Blood group)">
          <TextInput value={v.blood_group} onChange={(e) => set({ blood_group: e.target.value })} />
        </Field>
      </div>

      {/* Schooling, college and work.

          Collapsed until switched on, so a household correcting a phone number
          never scrolls past three empty sections. A person can be in more than
          one at once — a son at college who also works. */}
      {(["schooling", "college", "work"] as const).map((k) => (
        <ActivityBlock
          key={k}
          which={k}
          a={v[k]}
          onChange={(next) => set({ [k]: next } as Partial<MemberDraft>)}
        />
      ))}
    </div>
  );
}

/** What each block is called, and what its one required pick is called. */
const BLOCK_TA: Record<ActivityKey, { section: string; pick: string; add: string }> = {
  schooling: {
    section: "பள்ளியில் படிக்கிறார் (At school)",
    pick: "பள்ளி (School)",
    add: "பள்ளியைச் சேர்க்க",
  },
  college: {
    section: "கல்லூரியில் படிக்கிறார் (At college)",
    pick: "கல்லூரி (College)",
    add: "கல்லூரியைச் சேர்க்க",
  },
  work: {
    section: "வேலை செய்கிறார் (Working)",
    pick: "தொழில் (Occupation)",
    add: "தொழிலைச் சேர்க்க",
  },
};

/**
 * One activity section.
 *
 * The comboboxes carry `audience="household"`, which points them at
 * `/self-service/lookups/:kind` with the sitting token. The staff routes
 * `/schools`, `/colleges`, `/occupations` and `/places` need `member.read` —
 * three 403s on a public page, which is why this form could not simply mount
 * `MemberFields`.
 */
function ActivityBlock({
  which,
  a,
  onChange,
}: {
  which: ActivityKey;
  a: ActivityDraft;
  onChange: (next: ActivityDraft) => void;
}) {
  const t = BLOCK_TA[which];
  const lookupKind = which === "schooling" ? "school" : which === "college" ? "college" : "occupation";
  const set = (patch: Partial<ActivityDraft>) => onChange({ ...a, ...patch });

  return (
    <div className="border-t pt-3" style={{ borderColor: "#e2e8f0" }}>
      <label className="flex items-center gap-2 font-bold" style={{ color: "#0D5C63" }}>
        <input
          type="checkbox"
          checked={a.on}
          onChange={(e) => set({ on: e.target.checked })}
        />
        {t.section}
      </label>

      {a.on && (
        <div className="mt-3 space-y-3">
          <Field label={t.pick} required>
            <LookupCombobox
              kind={lookupKind}
              audience="household"
              value={a.lookup_id}
              valueLabel={a.lookup_label}
              onChange={(id, row) =>
                set({ lookup_id: id, lookup_label: row ? row.name_ta || row.name : null })
              }
              // Asked at the moment of adding: a lookup entry cannot be edited
              // afterwards, so an occupation added without its industry is
              // mis-grouped in the priest's reports for good.
              createChoice={
                which === "work"
                  ? {
                      key: "industry",
                      label: "எந்தத் துறை (Which industry)",
                      options: Object.entries(INDUSTRY_TA).map(([value, label]) => ({
                        value,
                        label,
                      })),
                    }
                  : undefined
              }
              placeholder="தேடுங்கள் அல்லது எழுதுங்கள்…"
              addLabel={(typed) => `+ “${typed}” — ${t.add}`}
              emptyText="பட்டியல் இன்னும் காலியாக உள்ளது — பெயரை எழுதி முதலாவதாகச் சேர்க்கலாம்."
              clearLabel="நீக்கு (clear)"
            />
          </Field>

          {which === "schooling" && (
            <Field label="வகுப்பு (Standard)" hint="எ.கா. 10, +2 — which class they are in now.">
              <TextInput value={a.standard} onChange={(e) => set({ standard: e.target.value })} />
            </Field>
          )}

          {which === "college" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="படிப்பின் ஆண்டு (Year of course)" hint="1, 2, 3…">
                <TextInput
                  value={a.course_year}
                  inputMode="numeric"
                  onChange={(e) => set({ course_year: e.target.value })}
                />
              </Field>
              <Field label="படிப்பு (Degree)" hint="எ.கா. B.Sc., ITI, Diploma.">
                <TextInput value={a.degree} onChange={(e) => set({ degree: e.target.value })} />
              </Field>
            </div>
          )}

          <Field
            label={which === "work" ? "வேலை செய்யும் இடம் (Place of working)" : "இடம் (Place)"}
            hint={
              which === "work"
                ? "வெளிநாட்டில் இருந்தால் அந்த நாட்டைச் சேர்க்கவும் — if the work is abroad, add that country."
                : undefined
            }
          >
            <LookupCombobox
              kind="place"
              audience="household"
              value={a.place_id}
              valueLabel={a.place_label}
              onChange={(id, row) =>
                set({ place_id: id, place_label: row ? row.name_ta || row.name : null })
              }
              createDefaults={{ kind: "town" }}
              createChoice={{
                key: "country",
                label: "எந்த நாடு (Which country)",
                options: COMMON_COUNTRIES.map((c) => ({ value: c, label: c })),
              }}
              placeholder="ஊரைத் தேடுங்கள்…"
              addLabel={(typed) => `+ “${typed}” — ஊரைச் சேர்க்க`}
              emptyText="பட்டியல் இன்னும் காலியாக உள்ளது — ஊரின் பெயரை எழுதலாம்."
              clearLabel="நீக்கு (clear)"
            />
          </Field>
        </div>
      )}
    </div>
  );
}
