"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import StatusPill from "@/components/ui/StatusPill";
import { Field, FormActions, FormCard, Select, TamilTextArea, TextInput } from "@/components/ui/Field";
import { useFamily, useTransferFamily } from "@/hooks/useFamilies";
import { useAnbiyams, useNextSerial } from "@/hooks/useStructure";
import { cardNumber } from "@/src/lib/domain-labels";
import type { Anbiyam } from "@/src/types";

/**
 * A move between Anbiyams.
 *
 * Recorded as an event rather than an edit: the family code carries the old
 * Anbiyam's prefix, so overwriting anbiyam_id would leave the code silently
 * describing the wrong place, and the history of where the family used to be
 * would be gone.
 */
export default function TransferFamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useFamily(id);
  const transfer = useTransferFamily(id);
  const { data: anbiyamRes } = useAnbiyams({ with_counts: "true" });

  const [toAnbiyamId, setToAnbiyamId] = useState("");
  const [effectiveOn, setEffectiveOn] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<"vacant_slot" | "appended">("vacant_slot");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: serialRes } = useNextSerial(method === "vacant_slot" ? toAnbiyamId : "");
  const family = data?.data;
  const currentAnbiyamId =
    family && typeof family.anbiyam_id !== "string" ? family.anbiyam_id._id : "";
  const anbiyams = ((anbiyamRes?.data ?? []) as Anbiyam[]).filter(
    (a) => a.status === "active" && a._id !== currentAnbiyamId,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!toAnbiyamId) return setError("Pick the destination Anbiyam.");

    const res = await transfer.mutateAsync({
      to_anbiyam_id: toAnbiyamId,
      effective_on: new Date(effectiveOn).toISOString(),
      assignment_method: method,
      reason: reason.trim() || undefined,
    });
    if (!res.success) setError(res.message);
    else router.push(`/families/${id}`);
  }

  if (isLoading) {
    return (
      <PageShell title="Transfer">
        <p className="text-sm text-slate-500">Loading…</p>
      </PageShell>
    );
  }
  if (!family) {
    return (
      <PageShell title="Transfer">
        <p className="text-sm text-slate-500">Family not found.</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Transfer ${family.family_code}`}
      subtitle="Moving a family issues it a new family code."
      breadcrumb={[
        { href: "/families", label: "Families" },
        { href: `/families/${id}`, label: family.family_code },
        { label: "Transfer" },
      ]}
    >
      <form onSubmit={submit} className="space-y-4 max-w-2xl">
        <FormCard title="From">
          <div className="rounded-lg p-4" style={{ backgroundColor: "#f8fafc" }}>
            <p className="font-mono text-xl font-black" style={{ color: "#0D5C63" }}>
              {cardNumber(family.family_code, family.card_year)}
            </p>
            <p className="text-xs text-slate-500">
              {typeof family.anbiyam_id === "string"
                ? "Current Anbiyam"
                : `${family.anbiyam_id.code}${family.anbiyam_id.name_ta ? ` · ${family.anbiyam_id.name_ta}` : ""}`}
              {" · position "}
              {family.serial_in_anbiyam}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            The old code is kept in this family&apos;s history, so a paper record marked{" "}
            <span className="font-mono">{family.family_code}</span> still resolves to them.
            Position {family.serial_in_anbiyam} is released to the next household there.
          </p>
        </FormCard>

        <FormCard title="To">
          <Field label="Destination Anbiyam" required>
            <Select value={toAnbiyamId} onChange={(e) => setToAnbiyamId(e.target.value)}>
              <option value="">Select an Anbiyam…</option>
              {anbiyams.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.code}
                  {a.name_ta ? ` · ${a.name_ta}` : a.name ? ` · ${a.name}` : ""} ({a.family_count ?? 0})
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Position in the destination"
            hint="A released slot keeps the Anbiyam's numbering dense; appending avoids reusing a number that appears on old paper."
          >
            <Select value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              <option value="vacant_slot">Take the lowest free position</option>
              <option value="appended">Continue the sequence</option>
            </Select>
          </Field>

          {toAnbiyamId && method === "vacant_slot" && serialRes?.data && (
            <div className="rounded-lg p-4" style={{ backgroundColor: "#f0fdfc" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                New family code
              </p>
              <p className="text-2xl font-black font-mono" style={{ color: "#0D5C63" }}>
                {serialRes.data.family_code}
              </p>
              <div className="mt-2">
                {serialRes.data.reused_vacant_slot ? (
                  <StatusPill label="Reusing a released position" tone="warning" icon="history" />
                ) : (
                  <StatusPill label="New position" tone="success" />
                )}
              </div>
            </div>
          )}

          <Field label="Effective date" required>
            <TextInput
              type="date"
              value={effectiveOn}
              onChange={(e) => setEffectiveOn(e.target.value)}
            />
          </Field>

          <Field label="Reason">
            <TamilTextArea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </FormCard>

        <FormActions
          submitting={transfer.isPending}
          submitLabel="Record transfer"
          error={error}
          onCancel={() => router.push(`/families/${id}`)}
        />
      </form>
    </PageShell>
  );
}
