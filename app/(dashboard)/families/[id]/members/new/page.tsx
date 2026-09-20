"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import { Field, FormActions, FormCard, Select, TextArea, TextInput } from "@/components/ui/Field";
import { useAddMember, useFamily } from "@/hooks/useFamilies";
import { MARITAL_LABEL, RELATIONSHIP_LABEL } from "@/src/lib/domain-labels";
import { MEMBER_RELATIONSHIPS, type MemberRelationship } from "@/src/types";

export default function NewMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data } = useFamily(id);
  const addMember = useAddMember(id);
  const [error, setError] = useState<string | null>(null);

  const family = data?.data;

  const [v, setV] = useState({
    name: "",
    name_ta: "",
    baptismal_name: "",
    initial: "",
    gender: "male" as "male" | "female",
    relationship_to_head: "magan" as MemberRelationship,
    date_of_birth: "",
    dob_is_estimated: false,
    marital_status: "unknown",
    occupation: "",
    education: "",
    phone: "",
    blood_group: "",
    notes: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!v.name.trim() && !v.name_ta.trim()) {
      return setError("A name is required — Tamil or English.");
    }

    const res = await addMember.mutateAsync({
      name: v.name.trim() || v.name_ta.trim(),
      name_ta: v.name_ta.trim() || undefined,
      baptismal_name: v.baptismal_name.trim() || undefined,
      initial: v.initial.trim() || undefined,
      gender: v.gender,
      relationship_to_head: v.relationship_to_head,
      date_of_birth: v.date_of_birth ? new Date(v.date_of_birth).toISOString() : undefined,
      dob_is_estimated: v.dob_is_estimated,
      marital_status: v.marital_status,
      occupation: v.occupation.trim() || undefined,
      education: v.education.trim() || undefined,
      phone: v.phone.trim() || undefined,
      blood_group: v.blood_group.trim() || undefined,
      notes: v.notes.trim() || undefined,
    });

    if (!res.success) setError(res.message);
    else router.push(`/families/${id}`);
  }

  return (
    <PageShell
      title="Add member"
      subtitle={family ? `To ${family.family_code}` : undefined}
      breadcrumb={[
        { href: "/families", label: "Families" },
        { href: `/families/${id}`, label: family?.family_code ?? "Family" },
        { label: "Add member" },
      ]}
    >
      <form onSubmit={submit} className="space-y-4 max-w-3xl">
        <FormCard title="Person">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name in Tamil">
              <TextInput value={v.name_ta} onChange={(e) => setV({ ...v, name_ta: e.target.value })} />
            </Field>
            <Field label="Name in English">
              <TextInput value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
            </Field>
            <Field label="Baptismal name">
              <TextInput value={v.baptismal_name} onChange={(e) => setV({ ...v, baptismal_name: e.target.value })} />
            </Field>
            <Field label="Initial">
              <TextInput value={v.initial} onChange={(e) => setV({ ...v, initial: e.target.value })} />
            </Field>
            <Field label="Gender" required>
              <Select
                value={v.gender}
                onChange={(e) => setV({ ...v, gender: e.target.value as "male" | "female" })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </Field>
            <Field label="Relationship to head" required>
              <Select
                value={v.relationship_to_head}
                onChange={(e) =>
                  setV({ ...v, relationship_to_head: e.target.value as MemberRelationship })
                }
              >
                {MEMBER_RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {RELATIONSHIP_LABEL[r] ?? r}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </FormCard>

        <FormCard
          title="Dates and status"
          description="A date of birth is stored; the age is computed from it. An age stored on its own is wrong within a year."
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Date of birth">
              <TextInput
                type="date"
                value={v.date_of_birth}
                onChange={(e) => setV({ ...v, date_of_birth: e.target.value })}
              />
            </Field>
            <Field label="Is the date an estimate?">
              <Select
                value={String(v.dob_is_estimated)}
                onChange={(e) => setV({ ...v, dob_is_estimated: e.target.value === "true" })}
              >
                <option value="false">No — as recorded</option>
                <option value="true">Yes — worked back from an age</option>
              </Select>
            </Field>
            <Field label="Marital status">
              <Select
                value={v.marital_status}
                onChange={(e) => setV({ ...v, marital_status: e.target.value })}
              >
                {Object.entries(MARITAL_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Blood group">
              <TextInput value={v.blood_group} onChange={(e) => setV({ ...v, blood_group: e.target.value })} />
            </Field>
          </div>
          <p className="text-xs text-slate-500">
            Baptism, communion, confirmation and marriage are register entries, not fields here.
          </p>
        </FormCard>

        <FormCard title="Contact and work">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Phone">
              <TextInput value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />
            </Field>
            <Field label="Occupation">
              <TextInput value={v.occupation} onChange={(e) => setV({ ...v, occupation: e.target.value })} />
            </Field>
            <Field label="Education">
              <TextInput value={v.education} onChange={(e) => setV({ ...v, education: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <TextArea rows={2} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
          </Field>
        </FormCard>

        <FormActions
          submitting={addMember.isPending}
          submitLabel="Add member"
          error={error}
          onCancel={() => router.push(`/families/${id}`)}
        />
      </form>
    </PageShell>
  );
}
