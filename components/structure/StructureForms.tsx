"use client";

import { useState } from "react";
import { Field, FormActions, Select, TextInput } from "@/components/ui/Field";
import {
  useCreateAnbiyam,
  useCreateMandalam,
  useCreateSubstation,
  useUpdateAnbiyam,
  useUpdateMandalam,
  useUpdateSubstation,
} from "@/hooks/useStructure";
import type { Anbiyam, Mandalam, Substation } from "@/src/types";

export function MandalamForm({
  initial,
  substations,
  onDone,
}: {
  initial?: Mandalam;
  substations: Substation[];
  onDone: () => void;
}) {
  const create = useCreateMandalam();
  const update = useUpdateMandalam();
  const [error, setError] = useState<string | null>(null);
  const [v, setV] = useState({
    name: initial?.name ?? "",
    code: initial?.code ?? "",
    name_ta: initial?.name_ta ?? "",
    patron_saint: initial?.patron_saint ?? "",
    substation_id: initial?.substation_id ?? "",
    sequence: initial?.sequence ? String(initial.sequence) : "",
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
      substation_id: v.substation_id || undefined,
      sequence: v.sequence ? Number(v.sequence) : undefined,
    };
    const res = initial
      ? await update.mutateAsync({ id: initial._id, payload })
      : await create.mutateAsync(payload);
    if (!res.success) setError(res.message);
    else onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" required>
        <TextInput value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Mandalam 3" />
      </Field>
      <Field label="Code" required>
        <TextInput
          value={v.code}
          onChange={(e) => setV({ ...v, code: e.target.value })}
          placeholder="M3"
          style={{ textTransform: "uppercase" }}
        />
      </Field>
      <Field label="Name in Tamil">
        <TextInput value={v.name_ta} onChange={(e) => setV({ ...v, name_ta: e.target.value })} />
      </Field>
      <Field label="Patron saint">
        <TextInput value={v.patron_saint} onChange={(e) => setV({ ...v, patron_saint: e.target.value })} />
      </Field>
      {substations.length > 0 && (
        <Field label="Substation" hint="Leave blank if this zone sits directly under the parish.">
          <Select value={v.substation_id} onChange={(e) => setV({ ...v, substation_id: e.target.value })}>
            <option value="">None</option>
            {substations.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} — {s.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Display order">
        <TextInput
          type="number"
          min={1}
          value={v.sequence}
          onChange={(e) => setV({ ...v, sequence: e.target.value })}
        />
      </Field>
      <FormActions
        submitting={create.isPending || update.isPending}
        submitLabel={initial ? "Save Mandalam" : "Create Mandalam"}
        error={error}
        onCancel={onDone}
      />
    </form>
  );
}

export function AnbiyamForm({
  initial,
  mandalams,
  onDone,
}: {
  initial?: Anbiyam;
  mandalams: Mandalam[];
  onDone: () => void;
}) {
  const create = useCreateAnbiyam();
  const update = useUpdateAnbiyam();
  const [error, setError] = useState<string | null>(null);
  const [v, setV] = useState({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    name_ta: initial?.name_ta ?? "",
    mandalam_id: (initial?.mandalam_id as string) ?? "",
    patron_saint: initial?.patron_saint ?? "",
    meeting_day: initial?.meeting_day ?? "",
    meeting_place: initial?.meeting_place ?? "",
    sequence: initial?.sequence ? String(initial.sequence) : "",
  });

  // The code is part of every family_code issued under this Anbiyam, so once
  // families exist the API refuses to change it. Saying so up front is kinder
  // than letting the save fail.
  const codeLocked = Boolean(initial && (initial.family_count ?? 0) > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!v.code.trim()) return setError("Code is required — it is the prefix of every family code here.");

    const payload = {
      code: v.code.trim().toUpperCase(),
      name: v.name.trim() || undefined,
      name_ta: v.name_ta.trim() || undefined,
      mandalam_id: v.mandalam_id || undefined,
      patron_saint: v.patron_saint.trim() || undefined,
      meeting_day: v.meeting_day.trim() || undefined,
      meeting_place: v.meeting_place.trim() || undefined,
      sequence: v.sequence ? Number(v.sequence) : undefined,
    };
    const res = initial
      ? await update.mutateAsync({ id: initial._id, payload })
      : await create.mutateAsync(payload);
    if (!res.success) setError(res.message);
    else onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field
        label="Code"
        required
        hint={
          codeLocked
            ? `Locked — ${initial?.family_count} families already carry it in their family code.`
            : 'Becomes the prefix of every family code here, e.g. "ASS-17".'
        }
      >
        <TextInput
          value={v.code}
          disabled={codeLocked}
          onChange={(e) => setV({ ...v, code: e.target.value })}
          placeholder="ASS"
          style={{ textTransform: "uppercase" }}
        />
      </Field>
      <Field label="Name">
        <TextInput value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      </Field>
      <Field label="Name in Tamil">
        <TextInput value={v.name_ta} onChange={(e) => setV({ ...v, name_ta: e.target.value })} />
      </Field>
      <Field label="Mandalam" hint="Small parishes skip the zone level entirely.">
        <Select value={v.mandalam_id} onChange={(e) => setV({ ...v, mandalam_id: e.target.value })}>
          <option value="">Unassigned</option>
          {mandalams.map((m) => (
            <option key={m._id} value={m._id}>
              {m.code} — {m.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Patron saint">
        <TextInput value={v.patron_saint} onChange={(e) => setV({ ...v, patron_saint: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Meeting day">
          <TextInput value={v.meeting_day} onChange={(e) => setV({ ...v, meeting_day: e.target.value })} placeholder="Friday" />
        </Field>
        <Field label="Display order">
          <TextInput
            type="number"
            min={1}
            value={v.sequence}
            onChange={(e) => setV({ ...v, sequence: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Meeting place">
        <TextInput value={v.meeting_place} onChange={(e) => setV({ ...v, meeting_place: e.target.value })} />
      </Field>
      <FormActions
        submitting={create.isPending || update.isPending}
        submitLabel={initial ? "Save Anbiyam" : "Create Anbiyam"}
        error={error}
        onCancel={onDone}
      />
    </form>
  );
}

export function SubstationForm({ initial, onDone }: { initial?: Substation; onDone: () => void }) {
  const create = useCreateSubstation();
  const update = useUpdateSubstation();
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
      <Field label="Name" required>
        <TextInput value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      </Field>
      <Field label="Code" required>
        <TextInput
          value={v.code}
          onChange={(e) => setV({ ...v, code: e.target.value })}
          style={{ textTransform: "uppercase" }}
        />
      </Field>
      <Field label="Name in Tamil">
        <TextInput value={v.name_ta} onChange={(e) => setV({ ...v, name_ta: e.target.value })} />
      </Field>
      <Field label="Patron saint">
        <TextInput value={v.patron_saint} onChange={(e) => setV({ ...v, patron_saint: e.target.value })} />
      </Field>
      <FormActions
        submitting={create.isPending || update.isPending}
        submitLabel={initial ? "Save substation" : "Create substation"}
        error={error}
        onCancel={onDone}
      />
    </form>
  );
}
