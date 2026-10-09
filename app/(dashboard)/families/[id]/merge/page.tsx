"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import StatusPill from "@/components/ui/StatusPill";
import { Field, FormActions, FormCard, TamilTextArea, TextInput } from "@/components/ui/Field";
import { useCloseFamily, useFamilies, useFamily } from "@/hooks/useFamilies";
import { RELATIONSHIP_LABEL, cardNumber } from "@/src/lib/domain-labels";
import type { Family } from "@/src/types";

/**
 * Two households becoming one — a widowed mother's card folded into her son's.
 *
 * A merge is a close with a destination, so it ends at the same endpoint as
 * "closed" and "transferred out". It gets a page of its own because it needs two
 * things a confirmation dialog cannot ask for: which family, and whether the
 * people move with it.
 */
export default function MergeFamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useFamily(id);
  const close = useCloseFamily(id);

  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<Family | null>(null);
  const [moveMembers, setMoveMembers] = useState(true);
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Held back until there is something to search for, so the page does not open
  // by fetching the first 25 families in the parish.
  const query = search.trim();
  const { data: results, isFetching } = useFamilies(
    { q: query, limit: "8" },
    { enabled: query.length >= 2 },
  );

  const family = data?.data;
  const living = (family?.members ?? []).filter((m) => m.status === "active");
  const candidates = query.length >= 2
    ? ((results?.data?.rows ?? []) as Family[]).filter((f) => f._id !== id)
    : [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!target) return setError("Pick the family this one is merging into.");
    if (typed.trim() !== family?.family_code) {
      return setError(`Type ${family?.family_code} to confirm.`);
    }

    const res = await close.mutateAsync({
      status: "merged",
      merged_into: target._id,
      move_members: moveMembers,
      reason: reason.trim() || undefined,
    });
    if (!res.success) setError(res.message);
    else router.push(`/families/${id}`);
  }

  if (isLoading) {
    return (
      <PageShell title="Merge">
        <p className="text-sm text-slate-500">Loading…</p>
      </PageShell>
    );
  }
  if (!family) {
    return (
      <PageShell title="Merge">
        <p className="text-sm text-slate-500">Family not found.</p>
      </PageShell>
    );
  }
  if (family.status !== "active") {
    return (
      <PageShell title="Merge" breadcrumb={[{ href: "/families", label: "Families" }]}>
        <p className="text-sm text-slate-500">
          {family.family_code} is already {family.status.replace("_", " ")} and cannot be merged again.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Merge ${family.family_code}`}
      subtitle="This card is closed and its people become part of another household."
      breadcrumb={[
        { href: "/families", label: "Families" },
        { href: `/families/${id}`, label: family.family_code },
        { label: "Merge" },
      ]}
    >
      <form onSubmit={submit} className="space-y-4 max-w-2xl">
        <FormCard title="This family">
          <div className="rounded-lg p-4" style={{ backgroundColor: "#f8fafc" }}>
            <p className="font-mono text-xl font-black" style={{ color: "#0D5C63" }}>
              {cardNumber(family.family_code, family.card_year)}
            </p>
            <p className="text-xs text-slate-500">
              {living.length} living member{living.length === 1 ? "" : "s"}
              {" · position "}
              {family.serial_in_anbiyam} is released
            </p>
          </div>
        </FormCard>

        <FormCard title="Merging into">
          <Field label="Find the family" hint="Search by family code, phone or locality.">
            <TextInput
              value={search}
              placeholder="ASS-4"
              onChange={(e) => {
                setSearch(e.target.value);
                setTarget(null);
              }}
            />
          </Field>

          {target ? (
            <div className="rounded-lg p-4 flex items-center justify-between gap-3" style={{ backgroundColor: "#f0fdfc" }}>
              <div>
                <p className="text-2xl font-black font-mono" style={{ color: "#0D5C63" }}>
                  {target.family_code}
                </p>
                <p className="text-xs text-slate-500">
                  {typeof target.anbiyam_id === "string" ? "" : `${target.anbiyam_id.code} · `}
                  {typeof target.head_member_id === "string" || !target.head_member_id
                    ? "No head recorded"
                    : target.head_member_id.name_ta || target.head_member_id.name}
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-bold"
                style={{ color: "#dc2626" }}
                onClick={() => setTarget(null)}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              {query.length >= 2 && isFetching && (
                <p className="text-xs text-slate-400">Searching…</p>
              )}
              {query.length >= 2 && !isFetching && candidates.length === 0 && (
                <p className="text-xs text-slate-500">No active family matches that.</p>
              )}
              <ul className="divide-y" style={{ borderColor: "#e2e8f0" }}>
                {candidates.map((f) => (
                  <li key={f._id}>
                    <button
                      type="button"
                      className="w-full text-left py-2.5 flex items-baseline gap-3"
                      onClick={() => setTarget(f)}
                    >
                      <span className="font-mono text-sm font-bold" style={{ color: "#0D5C63" }}>
                        {f.family_code}
                      </span>
                      <span className="text-xs text-slate-500">
                        {typeof f.head_member_id === "string" || !f.head_member_id
                          ? "No head recorded"
                          : f.head_member_id.name_ta || f.head_member_id.name}
                        {f.locality ? ` · ${f.locality}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </FormCard>

        <FormCard
          title="The people"
          description="Deceased members stay on this card either way."
        >
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={moveMembers}
              onChange={(e) => setMoveMembers(e.target.checked)}
            />
            <span>
              Move the {living.length} living member{living.length === 1 ? "" : "s"} onto{" "}
              <span className="font-mono font-bold">{target?.family_code ?? "that card"}</span>
              <span className="block text-xs text-slate-500">
                They stay listed here as having come from {family.family_code}. Their relationship
                to the head is carried over as it is now, so check it on the destination card —
                a husband here is somebody&apos;s father there. The destination keeps its own head
                and spouse.
              </span>
            </span>
          </label>

          {moveMembers && living.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm">
              {living.map((m) => (
                <li key={m._id} className="flex items-center justify-between gap-3">
                  <span>{m.name_ta || m.name}</span>
                  <StatusPill
                    label={RELATIONSHIP_LABEL[m.relationship_to_head] ?? m.relationship_to_head}
                    tone="neutral"
                  />
                </li>
              ))}
            </ul>
          )}

          {moveMembers && living.length === 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Nobody living is recorded on this card, so nothing will move.
            </p>
          )}
        </FormCard>

        <FormCard title="Confirm">
          <Field label="Reason" lang="tamil">
            <TamilTextArea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <Field label={`Type ${family.family_code} to confirm`} required>
            <TextInput value={typed} onChange={(e) => setTyped(e.target.value)} />
          </Field>
          <p className="text-xs text-slate-500">
            The record is kept and its history stays readable, but {family.family_code} becomes free
            for the next household in this Anbiyam.
          </p>
        </FormCard>

        <FormActions
          submitting={close.isPending}
          submitLabel="Merge family"
          error={error}
          onCancel={() => router.push(`/families/${id}`)}
        />
      </form>
    </PageShell>
  );
}
