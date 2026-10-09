"use client";

import DateInputBase, { type DateInputProps } from "@/components/ui/DateInput";
import TamilInputBase from "@/components/ui/TamilInput";
import TamilTextareaBase from "@/components/ui/TamilTextarea";

/**
 * Which language a box expects, said on the label rather than left to be
 * discovered by typing into it.
 *
 * Three cases needed it and only one of them was obvious. A pair of fields
 * ("Name" beside "Name in Tamil") says so in the label text already. A single
 * field driven by a LanguageToggle changes language under you, so the badge has
 * to follow the toggle. The third was the real complaint: TamilTextInput
 * defaults to tamilMode, so Locality, House note, Reason, Notes and a couple of
 * dozen others transliterate to Tamil while their labels say nothing at all.
 *
 * Wording and order match LanguageToggle — "த Tamil", "A English" — so the badge
 * and the switch that controls it read as the same thing.
 */
export type FieldLang = "tamil" | "english";

const LANG_BADGE: Record<FieldLang, { text: string; bg: string; fg: string }> = {
  tamil: { text: "த Tamil", bg: "#e6f4f1", fg: "#0D5C63" },
  english: { text: "A English", bg: "#eef2f6", fg: "#475569" },
};

export function LangBadge({ lang }: { lang: FieldLang }) {
  const b = LANG_BADGE[lang];
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[10px] font-bold normal-case tracking-normal"
      style={{ backgroundColor: b.bg, color: b.fg }}
    >
      {b.text}
    </span>
  );
}

/** Shared form field chrome so every form looks and behaves the same. */
export function Field({
  label,
  required,
  error,
  hint,
  lang,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  /** Pass a fixed language, or `tamilMode ? "tamil" : "english"` to follow a toggle. */
  lang?: FieldLang;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
        style={{ color: "#596065" }}
      >
        <span>
          {label}
          {required && <span style={{ color: "#dc2626" }}> *</span>}
        </span>
        {lang && <LangBadge lang={lang} />}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="text-xs font-medium" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}
    </div>
  );
}

const baseInput =
  "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseInput} ${props.className ?? ""}`} style={{ borderColor: "#dce3e9", ...(props.style ?? {}) }} />;
}

/**
 * `TextInput`'s chrome around a dd/mm/yyyy date box. Replaces
 * `<TextInput type="date" />`, which rendered in the browser's locale — see
 * `components/ui/DateInput.tsx` for why that had to go.
 *
 * `value` and `onValueChange` both speak ISO `yyyy-mm-dd`; the dd/mm/yyyy is
 * on screen only.
 */
export function DateInput({ className, style, ...props }: DateInputProps) {
  return (
    <DateInputBase
      {...props}
      className={`${baseInput} ${className ?? ""}`}
      style={{ borderColor: "#dce3e9", ...(style ?? {}) }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${baseInput} ${props.className ?? ""}`} style={{ borderColor: "#dce3e9", ...(props.style ?? {}) }} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${baseInput} ${props.className ?? ""}`} style={{ borderColor: "#dce3e9", ...(props.style ?? {}) }} />;
}

/**
 * The same chrome as `TextInput`, with Tamil transliteration wired in.
 *
 * `tamilMode` defaults to true because the usual caller is a field whose own
 * label already declares the language — "Name in Tamil" next to a plain
 * "Name in English". Those need no toggle: the box the priest types Tamil into
 * is the box marked Tamil. Forms with a single language-agnostic name field
 * pass `tamilMode` from a `LanguageToggle` instead.
 */
export function TamilTextInput({
  tamilMode = true,
  value,
  onChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  tamilMode?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <TamilInputBase
      {...props}
      tamilMode={tamilMode}
      value={value}
      onChange={onChange}
      className={`${baseInput} ${props.className ?? ""}`}
      style={{ borderColor: "#dce3e9", ...(props.style ?? {}) }}
    />
  );
}

/** `TextArea` with Tamil transliteration. See `TamilTextInput` for `tamilMode`. */
export function TamilTextArea({
  tamilMode = true,
  value,
  onChange,
  ...props
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
  tamilMode?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <TamilTextareaBase
      {...props}
      tamilMode={tamilMode}
      value={value}
      onChange={onChange}
      className={`${baseInput} ${props.className ?? ""}`}
      style={{ borderColor: "#dce3e9", ...(props.style ?? {}) }}
    />
  );
}

export function FormActions({
  submitting,
  submitLabel = "Save",
  onCancel,
  error,
}: {
  submitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  error?: string | null;
}) {
  return (
    <div className="pt-2 space-y-3">
      {error && (
        <div
          className="px-4 py-3 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
        >
          {error}
        </div>
      )}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border"
            style={{ borderColor: "#dce3e9", color: "#596065" }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 shadow-sm"
          style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

export function FormCard({ title, description, children }: { title?: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-4 sm:p-6 space-y-4" style={{ borderColor: "#e2e8f0" }}>
      {title && (
        <div>
          <h2 className="font-bold" style={{ color: "#0D5C63" }}>{title}</h2>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
