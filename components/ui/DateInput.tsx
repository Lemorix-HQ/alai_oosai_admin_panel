"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A date box that reads and writes **dd/mm/yyyy**, which is the order the
 * parish writes on paper and in the passbook, with a calendar button beside it.
 *
 * What you type into is a masked text box rather than `<input type="date">`: a
 * native date box renders in *the browser's* locale and nothing in HTML or CSS
 * can override that, so the same form showed 09/10/2026 on a phone set to
 * India and 10/09/2026 on a laptop set to the United States — the same nine
 * characters meaning two different days. Typing is also faster than a calendar
 * for the one date this system asks for most, a date of birth decades back.
 *
 * The calendar itself is still the platform's own, summoned by the button from
 * a second, invisible `type="date"` input. The locale problem does not reach
 * it: a picker shows a grid of day numbers, and whatever it hands back is
 * written into the text box as dd/mm/yyyy.
 *
 * `value` and what it hands to `onValueChange` are both ISO `yyyy-mm-dd` —
 * what the API validates with `@IsDateString()`. dd/mm/yyyy exists only
 * between the two, on screen. A half-finished or impossible date gives `""`,
 * so a caller's existing "required" check still catches it.
 *
 * `className`, `style`, `name`, `id`, `onBlur`, `min`, `max` and `disabled`
 * all behave as they did on the native input, and `min`/`max` bound the
 * calendar as well.
 */

const DMY = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** `yyyy-mm-dd` (or a full ISO timestamp) → `dd/mm/yyyy`; anything else → `""`. */
export function isoToDmy(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/**
 * `dd/mm/yyyy` → `yyyy-mm-dd`, or `""` when that is not a day on the calendar.
 *
 * The round-trip check is what rejects 31/02/2026 and 00/00/0000; `new Date`
 * would otherwise roll them forward to a real date nobody typed.
 */
export function dmyToIso(dmy: string): string {
  const m = DMY.exec(dmy.trim());
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  if (d.getFullYear() !== +yyyy || d.getMonth() + 1 !== +mm || d.getDate() !== +dd) return "";
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Keeps the slashes where they belong while someone types digits, and drops a
 * trailing one so backspace still walks back out of the field.
 */
function mask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter((part) => part.length > 0)
    .join("/");
}

export type DateInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  /** ISO `yyyy-mm-dd`, or `""` for empty. */
  value: string | null | undefined;
  /** Gets ISO `yyyy-mm-dd`, or `""` while the date is incomplete or impossible. */
  onValueChange: (iso: string) => void;
};

export default function DateInput({
  value,
  onValueChange,
  className,
  style,
  disabled,
  min,
  max,
  ...rest
}: DateInputProps) {
  const [text, setText] = useState(() => isoToDmy(value));
  const picker = useRef<HTMLInputElement>(null);

  // Follow `value` when it changes from somewhere else — a form reset, or the
  // record arriving from the API after the first render. Guarded by the
  // comparison, because without it every keystroke would be overwritten by the
  // empty ISO that a half-typed date reports back.
  useEffect(() => {
    if (dmyToIso(text) !== (value ?? "")) setText(isoToDmy(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function commit(dmy: string) {
    setText(dmy);
    onValueChange(dmyToIso(dmy));
  }

  function openCalendar() {
    const el = picker.current;
    if (!el) return;
    // showPicker() needs a user gesture, which the click is, and throws if the
    // browser is too old to have it. Falling back to the text box is no loss:
    // it is the field that actually holds the date.
    try {
      el.showPicker();
    } catch {
      picker.current?.focus();
    }
  }

  return (
    <span className="date-field relative block">
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={10}
        disabled={disabled}
        placeholder={rest.placeholder ?? "dd/mm/yyyy"}
        value={text}
        onChange={(e) => commit(mask(e.target.value))}
        className={className}
        // Inline, not a `pr-*` class: the caller's own `px-4` would otherwise
        // race it in the stylesheet, and the button needs the room reserved.
        style={{ paddingRight: "2.25rem", ...style }}
      />

      {/*
        Shrunk to a point rather than hidden. `showPicker()` throws on an
        element that is not being rendered, so `display: none` and
        `visibility: hidden` both take the calendar away with them; and it sits
        at the bottom-left so the popup opens under the field it belongs to.
      */}
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        min={min}
        max={max}
        // Round-tripped, because a stored timestamp would otherwise be rejected
        // by a native date box that accepts `yyyy-mm-dd` and nothing else.
        value={dmyToIso(isoToDmy(value))}
        onChange={(e) => commit(isoToDmy(e.target.value))}
        className="absolute bottom-0 left-3 h-px w-px opacity-0"
        // minHeight, because the public form sets a 48px floor on every input
        // and this one is meant to stay a point.
        style={{ pointerEvents: "none", minHeight: 0 }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={openCalendar}
        aria-label="Choose from a calendar"
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "19px" }} aria-hidden="true">
          calendar_today
        </span>
      </button>
    </span>
  );
}
