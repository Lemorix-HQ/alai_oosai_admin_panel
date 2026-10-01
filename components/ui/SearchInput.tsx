"use client";

import { useRef, useSyncExternalStore } from "react";
import TamilInputBase from "@/components/ui/TamilInput";

/**
 * A search box that can be typed in either language.
 *
 * The register this searches is a Tamil register. In the reference parish
 * 3,225 of 3,231 members carry their name in Tamil script in `name` itself,
 * and all 47 Anbiyams exist only as `name_ta` — `name` is null on every one of
 * them. The API matches that text with a plain regex and always has, so search
 * was never the broken part: there was simply no way to type Tamil into the one
 * box that asks for it, while every name field on every form already had
 * transliteration.
 *
 * Pass `tamil={false}` where the field matches machine keys rather than names —
 * the audit filter takes `role.assign`, and offering Tamil there would be a
 * toggle that can only make the search worse.
 */

const STORAGE_KEY = "alai.search.tamil";

/**
 * The mode is shared and remembered, not per box.
 *
 * `FilterBar` remounts on every route change, so a local state would drop a
 * clerk back to English each time they moved between Families and Members —
 * on a census where the names are Tamil, that is the whole task re-done by
 * hand. Kept in a module store rather than passed down because the boxes that
 * need it sit in unrelated trees: a filter row, a combobox inside a member
 * form, the events table.
 */
const listeners = new Set<() => void>();
let tamilMode: boolean | null = null;

function snapshot() {
  // Cached, because useSyncExternalStore compares snapshots by identity and
  // would loop if this re-read storage on every render.
  if (tamilMode === null) {
    try {
      tamilMode = window.localStorage.getItem(STORAGE_KEY) === "ta";
    } catch {
      // A private window, or a browser set to block site data, throws on the
      // access itself. Remembering is a convenience; the toggle still works.
      tamilMode = false;
    }
  }
  return tamilMode;
}

/** English on the server, so hydration has something stable to match. */
function serverSnapshot() {
  return false;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function setTamilMode(next: boolean) {
  tamilMode = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "ta" : "en");
  } catch {
    /* as above */
  }
  listeners.forEach((notify) => notify());
}

/** The current search language. Read it to label something in the same mode. */
export function useSearchLanguage() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export default function SearchInput({
  value,
  onChange,
  withIcon = true,
  tamil = true,
  className = "",
  style,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** The magnifier. Off inside a combobox, which reads as a field, not a search. */
  withIcon?: boolean;
  /** Off where the field matches machine keys rather than names. */
  tamil?: boolean;
}) {
  const stored = useSearchLanguage();
  const on = tamil && stored;
  const box = useRef<HTMLDivElement>(null);

  return (
    <div ref={box} className="relative">
      {withIcon && (
        // `z-10` because TamilInput wraps its field in a `relative` div of its
        // own, to hang the suggestion list from. That makes the field a
        // positioned box painted after this one, and its white background
        // would otherwise cover the magnifier completely.
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-10 text-slate-400 text-[18px]">
          search
        </span>
      )}
      <TamilInputBase
        {...props}
        tamilMode={on}
        value={value}
        onChange={onChange}
        className={`w-full ${withIcon ? "pl-10" : "pl-3"} ${
          tamil ? "pr-16" : "pr-3"
        } py-2.5 rounded-lg border bg-white text-sm outline-none focus:ring-2 ${className}`}
        style={{ borderColor: "#dce3e9", ...style }}
      />
      {tamil && (
        <div
          className="search-lang absolute right-1.5 top-1/2 -translate-y-1/2 z-10 flex overflow-hidden rounded-md border"
          style={{ borderColor: "#dce3e9" }}
        >
          {([
            ["ta", "த", "Type in Tamil"],
            ["en", "E", "Type in English"],
          ] as const).map(([key, glyph, label]) => {
            const active = key === "ta" ? on : !on;
            return (
              <button
                key={key}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={active}
                // Keep the caret where it was: without this the field loses
                // focus, and inside `.search-slide` losing focus closes the box.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setTamilMode(key === "ta");
                  box.current?.querySelector("input")?.focus();
                }}
                className="min-w-[24px] px-1.5 py-1 text-xs font-bold leading-none text-center transition-colors"
                style={{
                  backgroundColor: active ? "#0D5C63" : "#ffffff",
                  color: active ? "#ffffff" : "#94a3b8",
                }}
              >
                {glyph}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
