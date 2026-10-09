"use client";

import { useEffect, useState } from "react";
import AuthCard from "@/components/access/AuthCard";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import HouseholdMemberFields, {
  MARITAL_TA,
  RELATIONSHIP_TA,
  changesBetween,
  draftActivityError,
  draftFrom,
  draftNameError,
  draftToNewMember,
  emptyDraft,
  type MemberDraft,
} from "@/components/self-service/HouseholdMemberFields";
import {
  closeSittingAction,
  listSelfServiceParishesAction,
  openSittingAction,
  submitSittingAction,
} from "@/actions/self-service.actions";
import type {
  HouseholdMember, OpenedSitting, SelfServiceParish, SubmitSittingPayload, SubmittedSitting,
} from "@/src/types";

/**
 * The household's own form — the one page in this panel a parishioner opens.
 *
 * **One route segment, every step in client state.** `PUBLIC_PATHS` in
 * `proxy.ts` is matched by prefix, so a `/family-update/review` would make
 * `/family-update/anything` public too.
 *
 * Nothing here is a session. The sitting token lives in an httpOnly cookie set
 * by the action and is never handed to this component; `proxy.ts` still reads
 * this browser as signed out, which is correct.
 *
 * Tamil first, with the English underneath, hardcoded on this page — the panel
 * has no translation layer and one page does not justify adding one. **The
 * Tamil has not been read by a Tamil speaker.**
 */

const yearsOld = (iso: string): number | null => {
  if (!iso) return null;
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const months = now.getMonth() - dob.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
};

type Stage = "identify" | "edit" | "done";

export default function FamilyUpdatePage() {
  const [stage, setStage] = useState<Stage>("identify");
  const [snapshot, setSnapshot] = useState<OpenedSitting | null>(null);
  const [result, setResult] = useState<SubmittedSitting | null>(null);

  if (stage === "identify") {
    return (
      <Identify
        onOpened={(data) => {
          setSnapshot(data);
          setStage("edit");
        }}
      />
    );
  }

  if (stage === "edit" && snapshot) {
    return (
      <EditHousehold
        snapshot={snapshot}
        onSubmitted={(r) => {
          setResult(r);
          setStage("done");
          void closeSittingAction();
        }}
      />
    );
  }

  return <Done result={result} />;
}

// --------------------------------------------------------------- screen one

function Identify({ onOpened }: { onOpened: (data: OpenedSitting) => void }) {
  const [parishes, setParishes] = useState<SelfServiceParish[]>([]);
  const [parishId, setParishId] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await listSelfServiceParishesAction();
      const rows = res.data ?? [];
      setParishes(rows);
      if (rows.length === 1) setParishId(rows[0].id);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await openSittingAction({
      parish_id: parishId,
      family_code: familyCode.trim(),
      access_code: accessCode.trim(),
    });
    setBusy(false);
    if (!res.success || !res.data) {
      setError(res.message);
      return;
    }
    onOpened(res.data);
  }

  return (
    <AuthCard
      title="குடும்ப விவரம்"
      subtitle="Your family details — fill them in before the parish visits"
    >
      <form onSubmit={submit} className="touch-form space-y-4">
        <Field label="பங்கு (Parish)" required>
          {/* Tamil for every row, which is a data rule rather than a display
              one: `name_ta` is required on a parish (CreateParishDto, and the
              Tamil field on the parish form) precisely so this list cannot
              come back half in one script and half in the other. The fallback
              below is for a parish seeded before that rule — better a name in
              the wrong script than a parish nobody can pick. */}
          <Select value={parishId} onChange={(e) => setParishId(e.target.value)} required>
            <option value="">— தேர்ந்தெடுங்கள் (choose) —</option>
            {parishes.map((p) => (
              <option key={p.id} value={p.id}>{p.name_ta || p.name}</option>
            ))}
          </Select>
        </Field>

        <Field
          label="குடும்ப எண் (Family code)"
          required
          hint="உங்கள் குடும்ப அட்டையில் உள்ளது, எ.கா. ASS-17 — printed on your family card."
        >
          <TextInput
            value={familyCode}
            onChange={(e) => setFamilyCode(e.target.value)}
            placeholder="ASS-17"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </Field>

        <Field
          label="கடவுக் குறியீடு (Access code)"
          required
          hint="அன்பிய தலைவரிடம் கேட்டுப் பெறுங்கள் — ask your Anbiyam head for this."
        >
          {/* Digits only, so ask for the numeric keypad rather than a
              keyboard the reader then has to switch out of Tamil. `type` stays
              text: `number` would strip a leading zero and offer spinners. */}
          <TextInput
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="1234-5678"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </Field>

        {error && (
          <p
            className="text-sm rounded-lg px-3 py-2"
            style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !parishId}
          className="w-full py-3 rounded-lg font-bold disabled:opacity-60"
          style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
        >
          {busy ? "பார்க்கிறது… (checking)" : "தொடரவும் (Continue)"}
        </button>
      </form>
    </AuthCard>
  );
}

// --------------------------------------------------------------- screen two

interface MemberState {
  original: MemberDraft;
  draft: MemberDraft;
  open: boolean;
  dead: boolean;
}

function EditHousehold({
  snapshot,
  onSubmitted,
}: {
  snapshot: OpenedSitting;
  onSubmitted: (r: SubmittedSitting) => void;
}) {
  const minAge = snapshot.rules.min_age_for_phone;

  const [phone, setPhone] = useState(snapshot.family.primary_phone ?? "");
  const [locality, setLocality] = useState(snapshot.family.locality ?? "");
  const [houseNote, setHouseNote] = useState(snapshot.family.house_note ?? "");

  const [people, setPeople] = useState<Record<string, MemberState>>(() =>
    Object.fromEntries(
      snapshot.members.map((m: HouseholdMember) => {
        const d = draftFrom(m);
        return [m.id, { original: d, draft: d, open: false, dead: false }];
      }),
    ),
  );
  const [additions, setAdditions] = useState<MemberDraft[]>([]);

  const [submitterName, setSubmitterName] = useState("");
  const [submitterRelationship, setSubmitterRelationship] = useState("head");
  const [note, setNote] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setPerson = (id: string, patch: Partial<MemberState>) =>
    setPeople((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  const askPhoneFor = (d: MemberDraft) => {
    const age = yearsOld(d.date_of_birth);
    return age !== null && age >= minAge;
  };

  function build(): SubmitSittingPayload | string {
    if (!submitterName.trim()) {
      return "உங்கள் பெயரை எழுதுங்கள் — please write your own name at the bottom.";
    }

    const family: NonNullable<SubmitSittingPayload["family"]> = {};
    if (phone.trim() !== (snapshot.family.primary_phone ?? "")) family.primary_phone = phone.trim();
    if (locality.trim() !== (snapshot.family.locality ?? "")) family.locality = locality.trim();
    if (houseNote.trim() !== (snapshot.family.house_note ?? "")) family.house_note = houseNote.trim();

    const members: NonNullable<SubmitSittingPayload["members"]> = [];
    const deceased: NonNullable<SubmitSittingPayload["deceased"]> = [];

    for (const [id, st] of Object.entries(people)) {
      if (st.dead) {
        deceased.push({ member_id: id });
        continue;
      }
      // Before anything is compared: a section switched on with nothing picked
      // sends the same `null` as a section switched off, so letting it through
      // would ERASE the school already on the record.
      const activityError = draftActivityError(st.draft);
      if (activityError) return activityError;
      const changes = changesBetween(st.original, st.draft);
      const declaresSharing = st.draft.shares_household_phone;
      if (Object.keys(changes).length === 0 && !declaresSharing) continue;
      // A declaration on its own is not a change the backend will accept, so
      // it rides along with something; if nothing else changed, say so rather
      // than sending a request nobody can act on.
      if (Object.keys(changes).length === 0) continue;
      members.push({ member_id: id, changes, ...(declaresSharing ? { shares_household_phone: true } : {}) });
    }

    const new_members: NonNullable<SubmitSittingPayload["new_members"]> = [];
    for (const d of additions) {
      const nameError = draftNameError(d);
      if (nameError) return nameError;
      const activityError = draftActivityError(d);
      if (activityError) return activityError;
      new_members.push(draftToNewMember(d));
    }

    const count =
      (Object.keys(family).length ? 1 : 0) + members.length + new_members.length + deceased.length;
    if (count === 0) {
      return "எதையும் மாற்றவில்லை — nothing has been changed yet.";
    }

    return {
      submitter_name: submitterName.trim(),
      submitter_relationship: submitterRelationship,
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(Object.keys(family).length ? { family } : {}),
      ...(members.length ? { members } : {}),
      ...(new_members.length ? { new_members } : {}),
      ...(deceased.length ? { deceased } : {}),
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = build();
    if (typeof payload === "string") {
      setError(payload);
      return;
    }
    setBusy(true);
    const res = await submitSittingAction(payload);
    setBusy(false);
    if (!res.success || !res.data) {
      setError(res.message);
      return;
    }
    onSubmitted(res.data);
  }

  return (
    <div className="touch-form min-h-screen" style={{ backgroundColor: "#f7f9fc" }}>
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold" style={{ color: "#0D5C63" }}>
            {snapshot.family.family_code}
          </h1>
          <p className="text-sm" style={{ color: "#596065" }}>
            {snapshot.family.locality ?? ""} — உங்கள் குடும்ப விவரத்தைச் சரிபார்த்துத் திருத்துங்கள்.
          </p>
          <p className="text-xs text-slate-500">
            Check and correct your family&apos;s details. Nothing changes on the parish record
            until a parish worker confirms it with you and the priest approves.
          </p>
        </header>

        <form onSubmit={submit} className="space-y-4">
          <Card title="குடும்ப விவரம் (The household)">
            <Field
              label="குடும்ப கைபேசி எண் (Household phone)"
              required
              hint="செயலியில் உள்நுழைவதற்கு இந்த எண் தேவை — the parish needs at least one number for your house."
            >
              <TextInput
                type="tel"
                value={phone}
                inputMode="tel"
                autoComplete="tel"
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label="ஊர் / பகுதி (Locality)">
              <TextInput value={locality} onChange={(e) => setLocality(e.target.value)} />
            </Field>
            <Field label="வீட்டு அடையாளம் (House note)" hint="எ.கா. கோவில் அருகில் — a landmark that helps find the house.">
              <TextInput value={houseNote} onChange={(e) => setHouseNote(e.target.value)} />
            </Field>
          </Card>

          <Card title={`உறுப்பினர்கள் (${snapshot.members.length}) — Members`}>
            <div className="space-y-2">
              {snapshot.members.map((m) => {
                const st = people[m.id];
                if (!st) return null;
                return (
                  <div key={m.id} className="rounded-lg border" style={{ borderColor: "#dce3e9" }}>
                    {/* Stacked on a phone, side by side once there is room. Both
                        button labels are bilingual and long; on one 360px row
                        they push the person's name off the screen. */}
                    <div className="p-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
                      <div className="min-w-0">
                        <p className="font-bold truncate" style={{ color: "#0D5C63" }}>
                          {m.name_ta || m.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {RELATIONSHIP_TA[m.relationship_to_head] ?? m.relationship_to_head}
                          {m.marital_status ? ` · ${MARITAL_TA[m.marital_status] ?? m.marital_status}` : ""}
                        </p>
                      </div>
                      <div className="flex items-stretch gap-2 shrink-0">
                        {!st.dead && (
                          <button
                            type="button"
                            onClick={() => setPerson(m.id, { open: !st.open })}
                            className="flex-1 sm:flex-none px-3 py-2 rounded-lg border text-xs font-bold"
                            style={{ borderColor: "#e2e8f0", color: "#0D5C63" }}
                          >
                            {st.open ? "மூடு (close)" : "திருத்து (edit)"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setPerson(m.id, { dead: !st.dead, open: false })}
                          className="flex-1 sm:flex-none px-3 py-2 rounded-lg border text-xs font-bold"
                          style={{
                            borderColor: "#e2e8f0",
                            color: st.dead ? "#92400e" : "#dc2626",
                            backgroundColor: st.dead ? "#fef3c7" : undefined,
                          }}
                        >
                          {st.dead ? "மீட்டமை (undo)" : "காலமானார் (passed away)"}
                        </button>
                      </div>
                    </div>

                    {st.dead && (
                      <p className="px-3 pb-3 text-xs" style={{ color: "#92400e" }}>
                        பங்குத் தந்தையிடம் தெரிவிக்கப்படும் — this will be reported to the priest, with
                        our prayers for the family. The date of death is recorded in the parish
                        register, not here.
                      </p>
                    )}

                    {st.open && !st.dead && (
                      <div className="px-3 pb-3 border-t pt-3" style={{ borderColor: "#e2e8f0" }}>
                        <HouseholdMemberFields
                          v={st.draft}
                          setV={(draft) => setPerson(m.id, { draft })}
                          askPhone={askPhoneFor(st.draft)}
                          minAge={minAge}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="விடுபட்டவர்களைச் சேர்க்க (Add anyone missing)">
            {additions.map((d, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-3" style={{ borderColor: "#dce3e9" }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold" style={{ color: "#0D5C63" }}>
                    புதிய உறுப்பினர் {i + 1} (New member {i + 1})
                  </p>
                  <button
                    type="button"
                    onClick={() => setAdditions((a) => a.filter((_, j) => j !== i))}
                    className="text-xs font-bold"
                    style={{ color: "#dc2626" }}
                  >
                    நீக்கு (remove)
                  </button>
                </div>
                <HouseholdMemberFields
                  v={d}
                  setV={(next) => setAdditions((a) => a.map((x, j) => (j === i ? next : x)))}
                  askPhone={askPhoneFor(d)}
                  minAge={minAge}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAdditions((a) => [...a, emptyDraft()])}
              className="px-3 py-2 rounded-lg border text-sm font-bold"
              style={{ borderColor: "#e2e8f0", color: "#0D5C63" }}
            >
              + ஒருவரைச் சேர்க்க (add a person)
            </button>
          </Card>

          <Card title="இதை நிரப்பியவர் (Who filled this in)">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="உங்கள் பெயர் (Your name)" required>
                <TextInput value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} />
              </Field>
              <Field label="குடும்பத்தில் உங்கள் உறவு (Your relationship)">
                <Select
                  value={submitterRelationship}
                  onChange={(e) => setSubmitterRelationship(e.target.value)}
                >
                  {Object.entries(RELATIONSHIP_TA).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="பங்குத் தந்தைக்கு குறிப்பு (A note for the parish)">
              <TextArea value={note} rows={3} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </Card>

          {error && (
            <p
              className="text-sm rounded-lg px-4 py-3"
              style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-lg font-bold disabled:opacity-60"
            style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
          >
            {busy ? "அனுப்புகிறது… (sending)" : "பங்குக்கு அனுப்பு (Send to the parish)"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#0D5C63" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

// ------------------------------------------------------------- screen three

function Done({ result }: { result: SubmittedSitting | null }) {
  return (
    <AuthCard title="நன்றி" subtitle="Thank you — your details have been sent">
      <div className="touch-form space-y-4 text-sm" style={{ color: "#596065" }}>
        {result && (
          <p className="rounded-lg px-4 py-3" style={{ backgroundColor: "#d1fae5", color: "#065f46" }}>
            {result.change_count} மாற்றம் அனுப்பப்பட்டது — {result.change_count} change
            {result.change_count === 1 ? "" : "s"} sent for {result.family_code}.
          </p>
        )}
        <p>
          பங்கு ஊழியர் ஒருவர் உங்கள் வீட்டிற்கு வந்து இவற்றைச் சரிபார்ப்பார், பின்னர் பங்குத்
          தந்தை ஒப்புதல் அளிப்பார்.
        </p>
        <p className="text-xs text-slate-500">
          {result?.what_happens_next ??
            "A parish worker will check these details with you at your door, and the priest approves them."}
        </p>
        <p className="text-xs text-slate-500">
          இந்தப் படிவம் மூடப்பட்டது. மீண்டும் திருத்த வேண்டுமானால், அன்பிய தலைவரிடம் புதிய
          குறியீடு கேளுங்கள் — this form is now closed. Ask your Anbiyam head for a new code if you
          need to make further changes.
        </p>
      </div>
    </AuthCard>
  );
}
