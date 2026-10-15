"use client";

import { useState } from "react";
import { Field, FormActions, FormCard, TextInput } from "@/components/ui/Field";
import { useAddSodalityMember, useSodalityCandidates } from "@/hooks/useSodalities";
import type { SodalityCandidate } from "@/src/types";

/**
 * Search-and-pick a census member to enrol.
 *
 * Deliberately NOT a search over `/members` — the candidates route
 * (`sodality.member.manage`) returns only name and family code, never a
 * phone number or date of birth, so an animator who can run a sodality is
 * never handed the open census to do it.
 */
export function AddMemberCard({ sodalityId }: { sodalityId: string }) {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<SodalityCandidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const add = useAddSodalityMember(sodalityId);

  const query = search.trim();
  const { data: results, isFetching } = useSodalityCandidates(sodalityId, query, {
    enabled: !picked,
  });
  const candidates = picked ? [] : results?.data ?? [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!picked) return setError("Search for the member to enrol first.");

    const res = await add.mutateAsync({ member_id: picked._id });
    if (!res.success) setError(res.message);
    else {
      setPicked(null);
      setSearch("");
    }
  }

  return (
    <form onSubmit={submit}>
      <FormCard title="Add a member" description="Search by name — Tamil or English.">
        <Field label="Find the member">
          <TextInput
            value={search}
            placeholder="Start typing a name…"
            onChange={(e) => {
              setSearch(e.target.value);
              setPicked(null);
            }}
          />
        </Field>

        {picked ? (
          <div className="rounded-lg p-4 flex items-center justify-between gap-3" style={{ backgroundColor: "#f0fdfc" }}>
            <div>
              <p className="text-sm font-bold" style={{ color: "#0D5C63" }}>
                {picked.name_ta || picked.name}
              </p>
              <p className="text-xs text-slate-500">{picked.family_code ?? "—"}</p>
            </div>
            <button type="button" className="text-xs font-bold" style={{ color: "#dc2626" }} onClick={() => setPicked(null)}>
              Change
            </button>
          </div>
        ) : (
          <>
            {query.length >= 2 && isFetching && <p className="text-xs text-slate-400">Searching…</p>}
            {query.length >= 2 && !isFetching && candidates.length === 0 && (
              <p className="text-xs text-slate-500">No member matches that.</p>
            )}
            {query.length > 0 && query.length < 2 && (
              <p className="text-xs text-slate-400">Keep typing — at least two letters.</p>
            )}
            <ul className="divide-y" style={{ borderColor: "#e2e8f0" }}>
              {candidates.map((c) => (
                <li key={c._id}>
                  <button
                    type="button"
                    className="w-full text-left py-2 flex items-baseline gap-3"
                    onClick={() => setPicked(c)}
                  >
                    <span className="text-sm font-semibold" style={{ color: "#0D5C63" }}>
                      {c.name_ta || c.name}
                    </span>
                    <span className="text-xs text-slate-500">{c.family_code ?? "—"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <FormActions submitting={add.isPending} submitLabel="Enrol" error={error} />
      </FormCard>
    </form>
  );
}
