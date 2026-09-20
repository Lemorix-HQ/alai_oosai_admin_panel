"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, FormActions, FormCard, TextInput } from "@/components/ui/Field";
import type { Parish } from "@/src/types";
import type { ParishPayload } from "@/actions/parishes.actions";

/**
 * Create and edit share one form.
 *
 * `code` is editable on create and locked afterwards: it prefixes every
 * certificate number the parish has issued, so changing it later would detach
 * those documents from their register.
 */
export default function ParishForm({
  initial,
  submitLabel,
  onSubmit,
  cancelHref,
  lockCode = false,
}: {
  initial?: Partial<Parish>;
  submitLabel: string;
  onSubmit: (payload: ParishPayload) => Promise<{ success: boolean; message: string; data?: Parish }>;
  cancelHref: string;
  lockCode?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({
    name: initial?.name ?? "",
    code: initial?.code ?? "",
    name_ta: initial?.name_ta ?? "",
    patron_saint: initial?.patron_saint ?? "",
    diocese: initial?.diocese ?? "",
    deanery: initial?.deanery ?? "",
    phone: initial?.phone ?? "",
    alt_phone: initial?.alt_phone ?? "",
    email: initial?.email ?? "",
    line1: initial?.address?.line1 ?? "",
    street: initial?.address?.street ?? "",
    town: initial?.address?.town ?? "",
    taluk: initial?.address?.taluk ?? "",
    district: initial?.address?.district ?? "",
    state: initial?.address?.state ?? "",
    pincode: initial?.address?.pincode ?? "",
  });

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!values.name.trim()) return setError("Parish name is required.");
    if (!values.code.trim()) return setError("Parish code is required.");

    setBusy(true);
    try {
      const payload: ParishPayload = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        name_ta: values.name_ta.trim() || undefined,
        patron_saint: values.patron_saint.trim() || undefined,
        diocese: values.diocese.trim() || undefined,
        deanery: values.deanery.trim() || undefined,
        phone: values.phone.trim() || undefined,
        alt_phone: values.alt_phone.trim() || undefined,
        email: values.email.trim() || undefined,
        address: {
          line1: values.line1.trim() || undefined,
          street: values.street.trim() || undefined,
          town: values.town.trim() || undefined,
          taluk: values.taluk.trim() || undefined,
          district: values.district.trim() || undefined,
          state: values.state.trim() || undefined,
          pincode: values.pincode.trim() || undefined,
        },
      };
      const res = await onSubmit(payload);
      if (!res.success) {
        setError(res.message || "Save failed.");
        return;
      }
      router.push(cancelHref);
      router.refresh();
    } catch (e2) {
      setError((e2 as Error).message || "Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-3xl">
      <FormCard title="Identity">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Parish name" required>
            <TextInput value={values.name} onChange={set("name")} placeholder="Holy Lourdes Church" />
          </Field>
          <Field
            label="Code"
            required
            hint={lockCode ? "Locked — it prefixes issued certificate numbers." : "Short, unique. Prefixes certificate numbers."}
          >
            <TextInput
              value={values.code}
              onChange={set("code")}
              disabled={lockCode}
              placeholder="HLC"
              style={{ textTransform: "uppercase" }}
            />
          </Field>
          <Field label="Name in Tamil">
            <TextInput value={values.name_ta} onChange={set("name_ta")} placeholder="புனித லூர்து அன்னை ஆலயம்" />
          </Field>
          <Field label="Patron saint">
            <TextInput value={values.patron_saint} onChange={set("patron_saint")} />
          </Field>
          <Field label="Diocese">
            <TextInput value={values.diocese} onChange={set("diocese")} />
          </Field>
          <Field label="Deanery">
            <TextInput value={values.deanery} onChange={set("deanery")} />
          </Field>
        </div>
      </FormCard>

      <FormCard title="Contact">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Phone">
            <TextInput value={values.phone} onChange={set("phone")} />
          </Field>
          <Field label="Alternate phone">
            <TextInput value={values.alt_phone} onChange={set("alt_phone")} />
          </Field>
          <Field label="Email">
            <TextInput type="email" value={values.email} onChange={set("email")} />
          </Field>
        </div>
      </FormCard>

      <FormCard title="Address">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Line 1">
            <TextInput value={values.line1} onChange={set("line1")} />
          </Field>
          <Field label="Street">
            <TextInput value={values.street} onChange={set("street")} />
          </Field>
          <Field label="Town / village">
            <TextInput value={values.town} onChange={set("town")} />
          </Field>
          <Field label="Taluk">
            <TextInput value={values.taluk} onChange={set("taluk")} />
          </Field>
          <Field label="District">
            <TextInput value={values.district} onChange={set("district")} />
          </Field>
          <Field label="State">
            <TextInput value={values.state} onChange={set("state")} />
          </Field>
          <Field label="Pincode">
            <TextInput value={values.pincode} onChange={set("pincode")} />
          </Field>
        </div>
      </FormCard>

      <FormActions
        submitting={busy}
        submitLabel={submitLabel}
        error={error}
        onCancel={() => router.push(cancelHref)}
      />
    </form>
  );
}
