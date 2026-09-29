"use client";

import { useMemo } from "react";
import { Field } from "@/components/ui/Field";
import { useAnbiyams, useMandalams } from "@/hooks/useStructure";
import type { Anbiyam, Mandalam } from "@/src/types";

/**
 * Where a role may act: Mandalam narrows the choice, Anbiyam is the choice.
 *
 * A family belongs to an Anbiyam, never directly to a Mandalam, so the Anbiyam
 * is the only level that can actually be enforced. The Mandalam list is a
 * filter on top of it — pick a zone to bring its Anbiyams into view, and if you
 * tick none of them the whole zone is taken.
 *
 * What leaves this component is always a flat list of Anbiyam ids, resolved
 * here rather than on the server. That is deliberate: what was on screen when
 * the role was saved is exactly what was granted, and an Anbiyam added to that
 * zone next year does not quietly widen somebody's access.
 */

const UNZONED = "__none__";

export interface RoleScopeValue {
  mandalam_ids: string[];
  anbiyam_ids: string[];
}

/** The Anbiyams a selection actually covers. Empty means the whole parish. */
export function resolveScope(value: RoleScopeValue, anbiyams: Anbiyam[]): string[] {
  if (value.mandalam_ids.length === 0) return [];

  const covered = new Set<string>();
  for (const zone of value.mandalam_ids) {
    const inZone = anbiyams.filter((a) => (a.mandalam_id ?? UNZONED) === zone);
    const ticked = inZone.filter((a) => value.anbiyam_ids.includes(a._id));
    // No Anbiyam ticked in a selected zone means the whole zone.
    for (const a of ticked.length > 0 ? ticked : inZone) covered.add(a._id);
  }
  return [...covered];
}

/** Rebuilds the picker's state from a saved role, for the edit form. */
export function scopeFromRole(anbiyam_ids: string[], anbiyams: Anbiyam[]): RoleScopeValue {
  const held = new Set(anbiyam_ids);
  const zones = new Set<string>();
  for (const a of anbiyams) {
    if (held.has(a._id)) zones.add(a.mandalam_id ?? UNZONED);
  }
  return { mandalam_ids: [...zones], anbiyam_ids: [...held] };
}

function Chip({
  on,
  label,
  sub,
  onClick,
}: {
  on: boolean;
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="px-2.5 py-1.5 rounded-lg border text-xs text-left transition-colors cursor-pointer"
      style={{
        borderColor: on ? "#0D5C63" : "#e2e8f0",
        backgroundColor: on ? "#f0fdfc" : "#ffffff",
        color: on ? "#0D5C63" : "#475569",
      }}
    >
      <span className="font-bold">{label}</span>
      {sub && <span className="ml-1.5 text-slate-400">{sub}</span>}
    </button>
  );
}

export default function RoleScopePicker({
  value,
  onChange,
}: {
  value: RoleScopeValue;
  onChange: (next: RoleScopeValue) => void;
}) {
  const { data: mandalamRes, isLoading: loadingM } = useMandalams();
  const { data: anbiyamRes, isLoading: loadingA } = useAnbiyams();

  const mandalams = useMemo(() => (mandalamRes?.data ?? []) as Mandalam[], [mandalamRes]);
  const anbiyams = useMemo(() => (anbiyamRes?.data ?? []) as Anbiyam[], [anbiyamRes]);

  // A parish may run Anbiyams with no zone at all, and they would otherwise be
  // unreachable from a picker that starts at the Mandalam.
  const hasUnzoned = anbiyams.some((a) => !a.mandalam_id);
  const zones = useMemo(
    () => [
      ...mandalams.map((m) => ({ _id: m._id, label: m.name || m.code, code: m.code })),
      ...(hasUnzoned ? [{ _id: UNZONED, label: "No Mandalam", code: "—" }] : []),
    ],
    [mandalams, hasUnzoned],
  );

  const covered = resolveScope(value, anbiyams);

  function toggleZone(id: string) {
    const on = value.mandalam_ids.includes(id);
    onChange({
      mandalam_ids: on
        ? value.mandalam_ids.filter((z) => z !== id)
        : [...value.mandalam_ids, id],
      // Dropping a zone drops its Anbiyams with it, so a tick cannot survive
      // out of sight of the list it was made in.
      anbiyam_ids: on
        ? value.anbiyam_ids.filter(
            (a) => (anbiyams.find((x) => x._id === a)?.mandalam_id ?? UNZONED) !== id,
          )
        : value.anbiyam_ids,
    });
  }

  function toggleAnbiyam(id: string) {
    const on = value.anbiyam_ids.includes(id);
    onChange({
      ...value,
      anbiyam_ids: on
        ? value.anbiyam_ids.filter((a) => a !== id)
        : [...value.anbiyam_ids, id],
    });
  }

  if (loadingM || loadingA) {
    return <p className="text-sm text-slate-500">Loading the parish structure…</p>;
  }

  return (
    <div className="space-y-3">
      <Field
        label="Mandalams"
        hint="Leave every one unticked to let the role act across the whole parish."
      >
        <div className="flex flex-wrap gap-1.5">
          {zones.map((z) => (
            <Chip
              key={z._id}
              on={value.mandalam_ids.includes(z._id)}
              label={z.label}
              sub={z.code}
              onClick={() => toggleZone(z._id)}
            />
          ))}
        </div>
      </Field>

      {value.mandalam_ids.length > 0 && (
        <Field
          label="Anbiyams"
          hint="Tick none in a Mandalam and the role covers all of it."
        >
          <div className="space-y-3">
            {zones
              .filter((z) => value.mandalam_ids.includes(z._id))
              .map((z) => {
                const inZone = anbiyams.filter((a) => (a.mandalam_id ?? UNZONED) === z._id);
                const ticked = inZone.filter((a) => value.anbiyam_ids.includes(a._id));
                return (
                  <div key={z._id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: "#596065" }}
                      >
                        {z.label}
                        <span className="ml-2 font-normal normal-case text-slate-400">
                          {ticked.length === 0
                            ? `all ${inZone.length}`
                            : `${ticked.length} of ${inZone.length}`}
                        </span>
                      </h4>
                      {ticked.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              ...value,
                              anbiyam_ids: value.anbiyam_ids.filter(
                                (a) => !inZone.some((x) => x._id === a),
                              ),
                            })
                          }
                          className="text-[11px] font-bold cursor-pointer"
                          style={{ color: "#0D5C63" }}
                        >
                          Take the whole Mandalam
                        </button>
                      )}
                    </div>
                    {inZone.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        This Mandalam has no Anbiyams, so the role would cover nothing.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {inZone.map((a) => (
                          <Chip
                            key={a._id}
                            on={value.anbiyam_ids.includes(a._id)}
                            label={a.code}
                            sub={a.name || a.name_ta || undefined}
                            onClick={() => toggleAnbiyam(a._id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </Field>
      )}

      <p className="text-xs" style={{ color: covered.length === 0 ? "#92400e" : "#0D5C63" }}>
        {value.mandalam_ids.length === 0
          ? "Whole parish — this role is not limited to any Anbiyam."
          : covered.length === 0
            ? "No Anbiyams selected. A role scoped to nothing can reach nothing."
            : `${covered.length} Anbiyam${covered.length === 1 ? "" : "s"}. Anyone holding this role sees only these.`}
      </p>
    </div>
  );
}
