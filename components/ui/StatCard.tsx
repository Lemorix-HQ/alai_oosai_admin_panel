import Link from "next/link";

export default function StatCard({
  label,
  value,
  icon,
  href,
  hint,
}: {
  label: string;
  value: string | number;
  icon?: string;
  href?: string;
  hint?: string;
}) {
  const body = (
    <div
      className="bg-white rounded-xl border p-4 sm:p-5 h-full transition-shadow hover:shadow-sm"
      style={{ borderColor: "#e2e8f0" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="text-2xl font-black mt-1" style={{ color: "#0D5C63" }}>
            {value}
          </p>
          {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
        </div>
        {icon && (
          <span
            className="material-symbols-outlined shrink-0"
            style={{ color: "#F59E0B" }}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
