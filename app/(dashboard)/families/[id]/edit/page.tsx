"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import { Field, FormActions, FormCard, Select, TextArea, TextInput } from "@/components/ui/Field";
import { useFamily, useUpdateFamily } from "@/hooks/useFamilies";
import { PASTORAL_FLAG_LABEL } from "@/src/lib/domain-labels";
import { PASTORAL_FLAGS, type FamilyDetail, type PastoralFlag } from "@/src/types";

/**
 * Editable fields only.
 *
 * The Anbiyam and the position within it are absent by design: moving a family
 * issues a new family code and is recorded as a transfer, not as a field edit.
 */
function EditForm({ family }: { family: FamilyDetail }) {
  const router = useRouter();
  const update = useUpdateFamily(family._id);
  const [error, setError] = useState<string | null>(null);

  const [v, setV] = useState({
    primary_phone: family.primary_phone ?? "",
    card_year: family.card_year ? String(family.card_year) : "",
    locality: family.locality ?? "",
    house_note: family.house_note ?? "",
    residence_status: (family.residence?.status ?? "resident") as string,
    current_place: family.residence?.current_place ?? "",
    line1: family.address?.line1 ?? "",
    street: family.address?.street ?? "",
    town: family.address?.town ?? "",
    district: family.address?.district ?? "",
    pincode: family.address?.pincode ?? "",
    notes: family.notes ?? "",
    head_member_id: (family.head_member_id as string) ?? "",
    spouse_member_id: (family.spouse_member_id as string) ?? "",
  });
  const [flags, setFlags] = useState<Set<PastoralFlag>>(new Set(family.pastoral_flags ?? []));

  const headId =
    typeof family.head_member_id === "string"
      ? family.head_member_id
      : (family.head_member_id?._id ?? "");
  const spouseId =
    typeof family.spouse_member_id === "string"
      ? family.spouse_member_id
      : (family.spouse_member_id?._id ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await update.mutateAsync({
      primary_phone: v.primary_phone.trim() || undefined,
      card_year: v.card_year ? Number(v.card_year) : undefined,
      locality: v.locality.trim() || undefined,
      house_note: v.house_note.trim() || undefined,
      residence: {
        status: v.residence_status as "resident",
        current_place: v.current_place.trim() || undefined,
      },
      address: {
        line1: v.line1.trim() || undefined,
        street: v.street.trim() || undefined,
        town: v.town.trim() || undefined,
        district: v.district.trim() || undefined,
        pincode: v.pincode.trim() || undefined,
      },
      pastoral_flags: [...flags],
      notes: v.notes.trim() || undefined,
      head_member_id: v.head_member_id || undefined,
      spouse_member_id: v.spouse_member_id || undefined,
    });

    if (!res.success) setError(res.message);
    else router.push(`/families/${family._id}`);
  }

  const members = family.members ?? [];

  return (
    <form onSubmit={submit} className="space-y-4 max-w-3xl">
      <FormCard title="The couple" description="Chosen from the people already recorded on this card.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Head of family">
            <Select
              value={v.head_member_id || headId}
              onChange={(e) => setV({ ...v, head_member_id: e.target.value })}
            >
              <option value="">Not set</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name_ta || m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Spouse">
            <Select
              value={v.spouse_member_id || spouseId}
              onChange={(e) => setV({ ...v, spouse_member_id: e.target.value })}
            >
              <option value="">Not set</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name_ta || m.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </FormCard>

      <FormCard title="Contact and residence">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <TextInput value={v.primary_phone} onChange={(e) => setV({ ...v, primary_phone: e.target.value })} />
          </Field>
          <Field label="Card year" hint="Year of the most recent priest visit. Display only.">
            <TextInput type="number" value={v.card_year} onChange={(e) => setV({ ...v, card_year: e.target.value })} />
          </Field>
          <Field label="Residence">
            <Select value={v.residence_status} onChange={(e) => setV({ ...v, residence_status: e.target.value })}>
              <option value="resident">Resident</option>
              <option value="migrated">Migrated</option>
              <option value="outstation">Outstation</option>
              <option value="unknown">Unknown</option>
            </Select>
          </Field>
          <Field label="Currently at" hint="Where they are now, if not in the parish.">
            <TextInput value={v.current_place} onChange={(e) => setV({ ...v, current_place: e.target.value })} />
          </Field>
          <Field label="Locality">
            <TextInput value={v.locality} onChange={(e) => setV({ ...v, locality: e.target.value })} />
          </Field>
          <Field label="House note">
            <TextInput value={v.house_note} onChange={(e) => setV({ ...v, house_note: e.target.value })} />
          </Field>
        </div>
      </FormCard>

      <FormCard title="Address">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Line 1">
            <TextInput value={v.line1} onChange={(e) => setV({ ...v, line1: e.target.value })} />
          </Field>
          <Field label="Street">
            <TextInput value={v.street} onChange={(e) => setV({ ...v, street: e.target.value })} />
          </Field>
          <Field label="Town / village">
            <TextInput value={v.town} onChange={(e) => setV({ ...v, town: e.target.value })} />
          </Field>
          <Field label="District">
            <TextInput value={v.district} onChange={(e) => setV({ ...v, district: e.target.value })} />
          </Field>
          <Field label="Pincode">
            <TextInput value={v.pincode} onChange={(e) => setV({ ...v, pincode: e.target.value })} />
          </Field>
        </div>
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
        submitting={update.isPending}
        submitLabel="Save family"
        error={error}
        onCancel={() => router.push(`/families/${family._id}`)}
      />
    </form>
  );
}

export default function EditFamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useFamily(id);
  const family = data?.data;

  return (
    <PageShell
      title={family ? `Edit ${family.family_code}` : "Edit family"}
      breadcrumb={[
        { href: "/families", label: "Families" },
        { href: `/families/${id}`, label: family?.family_code ?? "Family" },
        { label: "Edit" },
      ]}
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !family ? (
        <p className="text-sm text-slate-500">Family not found.</p>
      ) : (
        <EditForm key={family._id} family={family} />
      )}
    </PageShell>
  );
}
