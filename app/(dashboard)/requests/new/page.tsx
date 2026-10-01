"use client";

import { useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/ui/PageShell";
import { Field, FormActions, FormCard, Select, TamilTextArea, TamilTextInput, TextInput } from "@/components/ui/Field";
import { useSession } from "@/src/session/SessionProvider";
import { useFamilies } from "@/hooks/useFamilies";
import { useRaiseChangeRequest } from "@/hooks/usePastoral";
import { useAnbiyams } from "@/hooks/useStructure";
import { CHANGE_REQUEST_TYPE_LABEL, RELATIONSHIP_LABEL } from "@/src/lib/domain-labels";
import {
  CHANGE_REQUEST_TYPES,
  MEMBER_RELATIONSHIPS,
  type Anbiyam,
  type ChangeRequestType,
  type MemberRelationship,
} from "@/src/types";

/**
 * Raising a request — the Anbiyam head's screen.
 *
 * It asks for a change; it does not make one. The person raising it cannot
 * verify or approve it, and the backend refuses if they try, so nothing here
 * needs to guard against that beyond saying so plainly.
 */
function RaiseForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { scope, parishWide } = useSession();
  const raise = useRaiseChangeRequest();

  const [anbiyamId, setAnbiyamId] = useState(params.get("anbiyam_id") ?? "");
  const [familyId, setFamilyId] = useState(params.get("family_id") ?? "");
  const [type, setType] = useState<ChangeRequestType>("add_member");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // add_member payload
  const [name, setName] = useState("");
  const [nameTa, setNameTa] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [relationship, setRelationship] = useState<MemberRelationship>("magan");
  const [dob, setDob] = useState("");
  // free-form payload for the other types
  const [details, setDetails] = useState("");

  const { data: anbiyamRes } = useAnbiyams();
  const allAnbiyams = (anbiyamRes?.data ?? []) as Anbiyam[];

  /** An Anbiyam head is assigned Anbiyams; the picker must not offer the rest. */
  const anbiyams = useMemo(() => {
    const assigned = scope?.anbiyam_ids ?? [];
    if (parishWide || assigned.length === 0) return allAnbiyams;
    return allAnbiyams.filter((a) => assigned.includes(a._id));
  }, [allAnbiyams, scope, parishWide]);

  const { data: familyRes } = useFamilies(
    anbiyamId ? { anbiyam_id: anbiyamId, limit: "100" } : { limit: "0" },
  );
  const families = anbiyamId ? (familyRes?.data?.rows ?? []) : [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!familyId) return setError("Pick the family this is about.");

    let payload: Record<string, unknown> = {};
    if (type === "add_member") {
      if (!name.trim() && !nameTa.trim()) {
        return setError("Give the person's name — Tamil or English.");
      }
      payload = {
        name: name.trim() || nameTa.trim(),
        name_ta: nameTa.trim() || undefined,
        gender,
        relationship_to_head: relationship,
        date_of_birth: dob ? new Date(dob).toISOString() : undefined,
      };
    } else if (details.trim()) {
      payload = { details: details.trim() };
    }

    const res = await raise.mutateAsync({
      type,
      family_id: familyId,
      payload,
      reason: reason.trim() || undefined,
    });

    if (!res.success) setError(res.message);
    else router.push(`/requests/${res.data?._id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-2xl">
      <FormCard title="Which family">
        <Field label="Anbiyam" required>
          <Select
            value={anbiyamId}
            onChange={(e) => {
              setAnbiyamId(e.target.value);
              setFamilyId("");
            }}
          >
            <option value="">Select an Anbiyam…</option>
            {anbiyams.map((a) => (
              <option key={a._id} value={a._id}>
                {a.code}
                {a.name_ta ? ` · ${a.name_ta}` : a.name ? ` · ${a.name}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Family" required hint={anbiyamId ? undefined : "Pick an Anbiyam first."}>
          <Select
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            disabled={!anbiyamId}
          >
            <option value="">Select a family…</option>
            {families.map((f) => (
              <option key={f._id} value={f._id}>
                {f.family_code}
                {f.locality ? ` · ${f.locality}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      </FormCard>

      <FormCard title="What is being asked">
        <Field label="Request" required>
          <Select value={type} onChange={(e) => setType(e.target.value as ChangeRequestType)}>
            {CHANGE_REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>
                {CHANGE_REQUEST_TYPE_LABEL[t] ?? t}
              </option>
            ))}
          </Select>
        </Field>

        {type === "add_member" ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name in Tamil">
              <TamilTextInput value={nameTa} onChange={(e) => setNameTa(e.target.value)} />
            </Field>
            <Field label="Name in English">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Gender" required>
              <Select
                value={gender}
                onChange={(e) => setGender(e.target.value as "male" | "female")}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </Field>
            <Field label="Relationship to head" required>
              <Select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as MemberRelationship)}
              >
                {MEMBER_RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {RELATIONSHIP_LABEL[r] ?? r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date of birth">
              <TextInput type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </Field>
          </div>
        ) : (
          <Field
            label="Details"
            hint="What should change, in your own words. The priest decides what is actually done."
          >
            <TamilTextArea rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
          </Field>
        )}

        <Field label="Reason">
          <TamilTextArea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </FormCard>

      <p className="text-xs text-slate-500">
        A request is checked at the door by a faculty member and approved by the priest.
        Nobody can decide a request they raised themselves — including you.
      </p>

      <FormActions
        submitting={raise.isPending}
        submitLabel="Raise request"
        error={error}
        onCancel={() => router.push("/requests")}
      />
    </form>
  );
}

export default function NewRequestPage() {
  return (
    <PageShell
      title="Raise a request"
      subtitle="Ask for a change to a family's record."
      breadcrumb={[{ href: "/requests", label: "Change requests" }, { label: "New" }]}
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <RaiseForm />
      </Suspense>
    </PageShell>
  );
}
