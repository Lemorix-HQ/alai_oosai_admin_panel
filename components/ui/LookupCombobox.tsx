"use client";

import { useState } from "react";
import SearchInput from "@/components/ui/SearchInput";
import { useCreateLookup, useLookup } from "@/hooks/useLookups";
import type { LookupAudience, LookupKind, LookupRow } from "@/actions/lookups.actions";

/**
 * Pick from a parish list, or add to it without leaving the form.
 *
 * The add path matters more than it looks: a faculty member standing at a
 * front door cannot go and curate a list first, and the school they are told
 * about will not be on it. Creation is idempotent on the server, so two
 * people adding the same school on the same evening converge on one row.
 *
 * `audience: "household"` points the same component at the public form's own
 * routes and lets the caller supply Tamil labels. Everything that is awkward
 * here — the delayed blur so a tap lands before the list unmounts, the
 * "+ Add" row, keeping a picked label visible when the search no longer
 * matches it — is awkward on a phone too, and was not worth writing twice.
 */
export default function LookupCombobox({
  kind,
  value,
  valueLabel,
  onChange,
  placeholder = "Search…",
  createDefaults = {},
  createChoice,
  audience = "staff",
  addLabel,
  emptyText,
  clearLabel,
}: {
  kind: LookupKind;
  value: string | null;
  /**
   * What to show for an already-selected row. The search results only hold
   * what the current term matches, so without this an edit form would open
   * with the field looking empty even though a school is set.
   */
  valueLabel?: string | null;
  onChange: (id: string | null, row?: LookupRow) => void;
  placeholder?: string;
  /** Extra fields sent when creating, e.g. { industry: 'other' }. */
  createDefaults?: Record<string, unknown>;
  /**
   * One classifying field asked for at the moment of adding.
   *
   * `Occupation.industry` and `Place.country` are what the priest's reports
   * group by, and there is no way to edit a lookup entry afterwards — so a row
   * added at a door without them is wrong permanently.
   */
  createChoice?: {
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  };
  /** Which routes to use. `household` carries the public form's sitting token. */
  audience?: LookupAudience;
  /** Overrides the "+ Add" wording, for the Tamil-first public form. */
  addLabel?: (typed: string) => string;
  /** Overrides the empty-list line, same reason. */
  emptyText?: string;
  /** Overrides the "Clear" link, same reason. */
  clearLabel?: string;
}) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [justPicked, setJustPicked] = useState<string | null>(null);
  const [choice, setChoice] = useState<string>(createChoice?.options[0]?.value ?? "");
  // Trimmed for the same reason the filter bar trims: `name_ta` is matched on
  // an unanchored regex, and committing a transliterated word leaves a
  // trailing space that then matches nothing.
  const { data } = useLookup(kind, term.trim() || undefined, undefined, audience);
  const create = useCreateLookup(kind, audience);
  const [error, setError] = useState<string | null>(null);

  const rows = (data?.data ?? []) as LookupRow[];
  const inRows = rows.find((r) => r._id === value);
  const shown = inRows ? inRows.name_ta || inRows.name : (justPicked ?? valueLabel ?? "");
  const typed = term.trim();
  const exact = rows.some((r) => r.name.toLowerCase() === typed.toLowerCase());

  function pick(row: LookupRow) {
    setJustPicked(row.name_ta || row.name);
    onChange(row._id, row);
    setTerm("");
    setOpen(false);
  }

  async function add() {
    // The list shows name_ta, so Tamil is what gets typed back. Recording it
    // as the Tamil name too is what makes the row findable next time instead
    // of becoming a second spelling.
    const isTamil = /[\u0B80-\u0BFF]/.test(typed);
    const res = await create.mutateAsync({
      name: typed,
      ...(isTamil ? { name_ta: typed } : {}),
      ...createDefaults,
      ...(createChoice && choice ? { [createChoice.key]: choice } : {}),
    });
    if (res.success && res.data) {
      pick(res.data as LookupRow);
      setError(null);
    } else {
      setError(res.message || "Could not add that.");
    }
  }

  return (
    <div className="relative">
      <SearchInput
        withIcon={false}
        value={open ? term : shown}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Delayed so a click on an option lands before the list unmounts.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />

      {open && (
        <ul
          className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border bg-white shadow-lg"
          style={{ borderColor: "#dce3e9" }}
        >
          {rows.map((r) => (
            <li key={r._id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(r)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              >
                {r.name_ta || r.name}
                {r.name_ta && r.name && <span className="text-slate-400"> · {r.name}</span>}
              </button>
            </li>
          ))}

          {typed && !exact && (
            <li className="border-t" style={{ borderColor: "#e2e8f0" }}>
              {createChoice && (
                <div className="px-3 pt-2">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    {createChoice.label}
                  </label>
                  <select
                    value={choice}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => setChoice(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 rounded border bg-white text-sm outline-none"
                    style={{ borderColor: "#dce3e9" }}
                  >
                    {createChoice.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={add}
                disabled={create.isPending}
                className="w-full text-left px-3 py-2 text-sm font-bold"
                style={{ color: "#0D5C63" }}
              >
                {addLabel ? addLabel(typed) : `+ Add “${typed}”`}
              </button>
            </li>
          )}

          {error && <li className="px-3 py-2 text-sm" style={{ color: "#991b1b" }}>{error}</li>}

          {rows.length === 0 && !typed && (
            <li className="px-3 py-2 text-sm text-slate-400">
              {emptyText ?? "Nothing on the list yet — type a name to add the first."}
            </li>
          )}
        </ul>
      )}

      {value && (
        <button
          type="button"
          onClick={() => {
            setJustPicked(null);
            onChange(null);
            setTerm("");
          }}
          className="mt-1 text-[11px] font-bold text-slate-500"
        >
          {clearLabel ?? "Clear"}
        </button>
      )}
    </div>
  );
}
