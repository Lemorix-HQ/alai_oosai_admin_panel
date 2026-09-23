"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PageShell from "@/components/ui/PageShell";
import { Field, FormActions, FormCard, Select, TamilTextArea, TamilTextInput, TextInput } from "@/components/ui/Field";
import { useCreateVisitRound } from "@/hooks/usePastoral";
import { useAnbiyams } from "@/hooks/useStructure";
import type { Anbiyam } from "@/src/types";

/**
 * Rounds are ad hoc: an Anbiyam may be visited more than once in a year and
 * different Anbiyams are visited at different times, so nothing here is unique
 * on Anbiyam plus date.
 */
export default function NewVisitRoundPage() {
  const router = useRouter();
  const create = useCreateVisitRound();
  const { data: anbiyamRes } = useAnbiyams({ with_counts: "true" });
  const anbiyams = ((anbiyamRes?.data ?? []) as Anbiyam[]).filter((a) => a.status === "active");

  const [anbiyamId, setAnbiyamId] = useState("");
  const [roundDate, setRoundDate] = useState(new Date().toISOString().slice(0, 10));
  const [label, setLabel] = useState(`${new Date().getFullYear()} visit`);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const chosen = anbiyams.find((a) => a._id === anbiyamId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!anbiyamId) return setError("Pick the Anbiyam this round covers.");

    const res = await create.mutateAsync({
      anbiyam_id: anbiyamId,
      round_date: new Date(roundDate).toISOString(),
      label: label.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    if (!res.success) setError(res.message);
    else router.push(`/visits/${res.data?._id}`);
  }

  return (
    <PageShell
      title="Open a visit round"
      subtitle="One round covers one Anbiyam."
      breadcrumb={[{ href: "/visits", label: "Visits" }, { label: "New round" }]}
    >
      <form onSubmit={submit} className="space-y-4 max-w-2xl">
        <FormCard title="Where and when">
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

          {chosen && (
            <div className="rounded-lg p-4" style={{ backgroundColor: "#f0fdfc" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Families to visit
              </p>
              <p className="text-2xl font-black font-mono" style={{ color: "#0D5C63" }}>
                {chosen.family_count ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Recorded on the round as it stands today. Families added later do not change it —
                this is the parish&apos;s record of that visit, not a live count.
              </p>
            </div>
          )}

          <Field label="Date" required>
            <TextInput type="date" value={roundDate} onChange={(e) => setRoundDate(e.target.value)} />
          </Field>

          <Field label="Label" hint="How the parish refers to this round, e.g. “2026 visit”.">
            <TamilTextInput value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>

          <Field label="Notes">
            <TamilTextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </FormCard>

        <FormActions
          submitting={create.isPending}
          submitLabel="Open round"
          error={error}
          onCancel={() => router.push("/visits")}
        />
      </form>
    </PageShell>
  );
}
