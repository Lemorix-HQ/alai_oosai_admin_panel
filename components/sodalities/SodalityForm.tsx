"use client";

import { useState } from "react";
import { Field, FormActions, TamilTextInput, TextInput } from "@/components/ui/Field";
import { useCreateSodality, useUpdateSodality } from "@/hooks/useSodalities";
import type { Sodality } from "@/src/types";

/** One component, create or edit decided by whether `initial` is passed — the
 * convention every structure/families form in this panel follows. */
export function SodalityForm({ initial, onDone }: { initial?: Sodality; onDone: () => void }) {
  const create = useCreateSodality();
  const update = useUpdateSodality();
  const [error, setError] = useState<string | null>(null);
  const [v, setV] = useState({
    name: initial?.name ?? "",
    code: initial?.code ?? "",
    name_ta: initial?.name_ta ?? "",
    patron_saint: initial?.patron_saint ?? "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!v.name.trim() || !v.code.trim()) return setError("Name and code are both required.");

    const payload = {
      name: v.name.trim(),
      code: v.code.trim().toUpperCase(),
      name_ta: v.name_ta.trim() || undefined,
      patron_saint: v.patron_saint.trim() || undefined,
    };
    const res = initial
      ? await update.mutateAsync({ id: initial._id, payload })
      : await create.mutateAsync(payload);
    if (!res.success) setError(res.message);
    else onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" lang="english" required>
        <TextInput
          value={v.name}
          onChange={(e) => setV({ ...v, name: e.target.value })}
          placeholder="Legion of Mary"
        />
      </Field>
      <Field label="Code" required hint="A short, parish-unique identifier for this sodality.">
        <TextInput
          value={v.code}
          onChange={(e) => setV({ ...v, code: e.target.value })}
          placeholder="LOM"
          style={{ textTransform: "uppercase" }}
        />
      </Field>
      <Field label="Name in Tamil" lang="tamil">
        <TamilTextInput value={v.name_ta} onChange={(e) => setV({ ...v, name_ta: e.target.value })} />
      </Field>
      <Field label="Patron saint" lang="tamil">
        <TamilTextInput value={v.patron_saint} onChange={(e) => setV({ ...v, patron_saint: e.target.value })} />
      </Field>
      <FormActions
        submitting={create.isPending || update.isPending}
        submitLabel={initial ? "Save sodality" : "Create sodality"}
        error={error}
        onCancel={onDone}
      />
    </form>
  );
}
