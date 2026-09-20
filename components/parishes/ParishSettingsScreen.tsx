"use client";

import { useState } from "react";
import PageShell from "@/components/ui/PageShell";
import { Field, FormActions, FormCard, Select, TextInput } from "@/components/ui/Field";
import { useParish, useUpdateParishSettings } from "@/hooks/useParishes";
import type { Parish, ParishSettings } from "@/src/types";

/**
 * Money is stored as integer paise everywhere in this system. The form works in
 * rupees because that is what a priest types, and converts at the boundary — so
 * the stored value is never a float.
 */
const toPaise = (rupees: string) => Math.round(Number(rupees) * 100);
const toRupees = (paise?: number | null) =>
  paise === null || paise === undefined ? "" : String(paise / 100);

/**
 * Keyed on the parish by its caller so the loaded settings seed `useState`
 * directly. Copying props into state from an effect renders twice and fights
 * anything already typed.
 */
function SettingsForm({ parish }: { parish: Parish }) {
  const update = useUpdateParishSettings(parish._id);
  const settings = parish.settings;

  const [values, setValues] = useState({
    min_age_for_head: String(settings?.min_age_for_head ?? 25),
    allow_head_change_to_son: String(settings?.allow_head_change_to_son ?? true),
    currency: settings?.currency ?? "INR",
    default_offering_minimum: toRupees(settings?.default_offering_minimum),
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const age = Number(values.min_age_for_head);
    if (!Number.isInteger(age) || age < 16) {
      setError("Minimum age for head of family must be a whole number, 16 or above.");
      return;
    }

    const payload: Partial<ParishSettings> = {
      min_age_for_head: age,
      allow_head_change_to_son: values.allow_head_change_to_son === "true",
      currency: values.currency,
      ...(values.default_offering_minimum.trim()
        ? { default_offering_minimum: toPaise(values.default_offering_minimum) }
        : {}),
    };

    const res = await update.mutateAsync(payload);
    if (!res.success) setError(res.message);
    else setSaved(true);
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-2xl">
      <FormCard
        title="Head of family"
        description="Headship passes from the senior male to the spouse, and then to a son — but only once he reaches this age."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Minimum age for head" required>
            <TextInput
              type="number"
              min={16}
              value={values.min_age_for_head}
              onChange={(e) => setValues((v) => ({ ...v, min_age_for_head: e.target.value }))}
            />
          </Field>
          <Field label="Allow headship to pass to a son">
            <Select
              value={values.allow_head_change_to_son}
              onChange={(e) =>
                setValues((v) => ({ ...v, allow_head_change_to_son: e.target.value }))
              }
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </Field>
        </div>
      </FormCard>

      <FormCard title="Offerings" description="The annual contribution, collected in two instalments.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Currency">
            <Select
              value={values.currency}
              onChange={(e) => setValues((v) => ({ ...v, currency: e.target.value }))}
            >
              <option value="INR">INR — Indian Rupee</option>
            </Select>
          </Field>
          <Field label="Minimum annual offering" hint="In rupees. Leave blank if the parish sets no minimum.">
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={values.default_offering_minimum}
              onChange={(e) =>
                setValues((v) => ({ ...v, default_offering_minimum: e.target.value }))
              }
            />
          </Field>
        </div>
      </FormCard>

      {saved && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: "#d1fae5", color: "#065f46" }}>
          Settings saved.
        </div>
      )}

      <FormActions submitting={update.isPending} submitLabel="Save settings" error={error} />
    </form>
  );
}

export default function ParishSettingsScreen({
  parishId,
  breadcrumb,
}: {
  parishId: string;
  breadcrumb?: Array<{ href?: string; label: string }>;
}) {
  const { data, isLoading } = useParish(parishId);
  const parish = data?.data;

  return (
    <PageShell title="Parish settings" subtitle={parish?.name} breadcrumb={breadcrumb}>
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !parish ? (
        <p className="text-sm text-slate-500">Parish not found.</p>
      ) : (
        <SettingsForm key={parish._id} parish={parish} />
      )}
    </PageShell>
  );
}
