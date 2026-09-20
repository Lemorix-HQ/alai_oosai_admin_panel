"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PageShell from "@/components/ui/PageShell";
import { Field, FormActions, FormCard, Select, TextArea, TextInput } from "@/components/ui/Field";
import StatusPill from "@/components/ui/StatusPill";
import { useCreateFamily } from "@/hooks/useFamilies";
import { useAnbiyams, useNextSerial } from "@/hooks/useStructure";
import { PASTORAL_FLAG_LABEL } from "@/src/lib/domain-labels";
import { PASTORAL_FLAGS, type Anbiyam, type PastoralFlag } from "@/src/types";

export default function NewFamilyPage() {
  const router = useRouter();
  const create = useCreateFamily();
  const { data: anbiyamRes } = useAnbiyams({ with_counts: "true" });
  const anbiyams = ((anbiyamRes?.data ?? []) as Anbiyam[]).filter((a) => a.status === "active");

  const [anbiyamId, setAnbiyamId] = useState("");
  const { data: serialRes, isFetching: serialLoading } = useNextSerial(anbiyamId);
  const serial = serialRes?.data;

  const [v, setV] = useState({
    card_year: String(new Date().getFullYear()),
    primary_phone: "",
    locality: "",
    house_note: "",
    residence_status: "resident",
    notes: "",
    head_name: "",
    head_name_ta: "",
    spouse_name: "",
    spouse_name_ta: "",
  });
  const [flags, setFlags] = useState<Set<PastoralFlag>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!anbiyamId) return setError("Pick the Anbiyam this family belongs to.");

    // The serial is deliberately not sent: the server allocates the lowest free
    // one at insert time. Sending the number shown here would lose a race with
    // another admin filling the same form.
    const res = await create.mutateAsync({
      anbiyam_id: anbiyamId,
      card_year: v.card_year ? Number(v.card_year) : undefined,
      primary_phone: v.primary_phone.trim() || undefined,
      locality: v.locality.trim() || undefined,
      house_note: v.house_note.trim() || undefined,
      residence: { status: v.residence_status as "resident" },
      pastoral_flags: [...flags],
      notes: v.notes.trim() || undefined,
      head_name: v.head_name.trim() || undefined,
      head_name_ta: v.head_name_ta.trim() || undefined,
      spouse_name: v.spouse_name.trim() || undefined,
      spouse_name_ta: v.spouse_name_ta.trim() || undefined,
    });

    if (!res.success) {
      setError(res.message);
      return;
    }
    router.push(res.data?._id ? `/families/${res.data._id}` : "/families");
  }

  return (
    <PageShell
      title="New family"
      subtitle="The family code is issued by the server from the Anbiyam and the next free position."
      breadcrumb={[{ href: "/families", label: "Families" }, { label: "New" }]}
    >
      <form onSubmit={submit} className="space-y-4 max-w-3xl">
        <FormCard title="Where the family belongs">
          <Field label="Anbiyam" required>
            <Select value={anbiyamId} onChange={(e) => setAnbiyamId(e.target.value)}>
              <option value="">Select an Anbiyam…</option>
              {anbiyams.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.code}
                  {a.name_ta ? ` · ${a.name_ta}` : a.name ? ` · ${a.name}` : ""} ({a.family_count ?? 0})
                </option>
              ))}
            </Select>
          </Field>

          {anbiyamId && (
            <div className="rounded-lg p-4" style={{ backgroundColor: "#f0fdfc" }}>
              {serialLoading || !serial ? (
                <p className="text-sm text-slate-500">Resolving the next free position…</p>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Family code to be issued
                  </p>
                  <p className="text-2xl font-black font-mono" style={{ color: "#0D5C63" }}>
                    {serial.family_code}
                  </p>
                  <div className="mt-2">
                    {serial.reused_vacant_slot ? (
                      <StatusPill label="Reusing a released position" tone="warning" icon="history" />
                    ) : (
                      <StatusPill label="New position" tone="success" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {serial.reused_vacant_slot
                      ? "A family that left this Anbiyam released this slot. A paper record from an earlier year marked with this code refers to a different household."
                      : `Position ${serial.serial} continues the sequence; ${serial.active_families} families are active here.`}
                  </p>
                </>
              )}
            </div>
          )}
        </FormCard>

        <FormCard
          title="The couple"
          description="Optional. Creating them here saves opening the card again straight away; everyone else is added from the family card."
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Head of family — name">
              <TextInput value={v.head_name} onChange={(e) => setV({ ...v, head_name: e.target.value })} />
            </Field>
            <Field label="Head — name in Tamil">
              <TextInput value={v.head_name_ta} onChange={(e) => setV({ ...v, head_name_ta: e.target.value })} />
            </Field>
            <Field label="Spouse — name">
              <TextInput value={v.spouse_name} onChange={(e) => setV({ ...v, spouse_name: e.target.value })} />
            </Field>
            <Field label="Spouse — name in Tamil">
              <TextInput value={v.spouse_name_ta} onChange={(e) => setV({ ...v, spouse_name_ta: e.target.value })} />
            </Field>
          </div>
        </FormCard>

        <FormCard title="Household">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Phone">
              <TextInput value={v.primary_phone} onChange={(e) => setV({ ...v, primary_phone: e.target.value })} />
            </Field>
            <Field label="Card year" hint="The year of the most recent priest visit. Display only.">
              <TextInput
                type="number"
                value={v.card_year}
                onChange={(e) => setV({ ...v, card_year: e.target.value })}
              />
            </Field>
            <Field label="Locality">
              <TextInput value={v.locality} onChange={(e) => setV({ ...v, locality: e.target.value })} />
            </Field>
            <Field label="Residence">
              <Select
                value={v.residence_status}
                onChange={(e) => setV({ ...v, residence_status: e.target.value })}
              >
                <option value="resident">Resident</option>
                <option value="migrated">Migrated</option>
                <option value="outstation">Outstation</option>
                <option value="unknown">Unknown</option>
              </Select>
            </Field>
          </div>
          <Field label="House note" hint="How to find the house — a landmark, not an address.">
            <TextInput value={v.house_note} onChange={(e) => setV({ ...v, house_note: e.target.value })} />
          </Field>
        </FormCard>

        <FormCard title="Pastoral notes">
          <div className="flex flex-wrap gap-2">
            {PASTORAL_FLAGS.map((f) => (
              <label
                key={f}
                className="px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer flex items-center gap-2"
                style={{
                  borderColor: flags.has(f) ? "#0D5C63" : "#e2e8f0",
                  backgroundColor: flags.has(f) ? "#f0fdfc" : "#ffffff",
                }}
              >
                <input
                  type="checkbox"
                  checked={flags.has(f)}
                  onChange={() =>
                    setFlags((prev) => {
                      const next = new Set(prev);
                      if (next.has(f)) next.delete(f);
                      else next.add(f);
                      return next;
                    })
                  }
                />
                {PASTORAL_FLAG_LABEL[f] ?? f}
              </label>
            ))}
          </div>
          <Field label="Notes">
            <TextArea rows={3} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
          </Field>
        </FormCard>

        <FormActions
          submitting={create.isPending}
          submitLabel="Create family"
          error={error}
          onCancel={() => router.push("/families")}
        />
      </form>
    </PageShell>
  );
}
