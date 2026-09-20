"use client";

/** Shared form field chrome so every form looks and behaves the same. */
export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#596065" }}>
        {label}
        {required && <span style={{ color: "#dc2626" }}> *</span>}
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

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${baseInput} ${props.className ?? ""}`} style={{ borderColor: "#dce3e9", ...(props.style ?? {}) }} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${baseInput} ${props.className ?? ""}`} style={{ borderColor: "#dce3e9", ...(props.style ?? {}) }} />;
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
