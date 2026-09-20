import Link from "next/link";

/**
 * An empty list should say why it is empty and what to do next. "No families"
 * with nothing else leaves the user guessing whether it is broken.
 */
export default function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span
        className="material-symbols-outlined text-[48px] mb-3"
        style={{ color: "#cbd5e1" }}
      >
        {icon}
      </span>
      <h3 className="text-base font-bold" style={{ color: "#2c3338" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 mt-1 max-w-md">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-4 font-bold py-2 px-5 rounded-lg inline-flex items-center gap-2 shadow-sm"
          style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {action.label}
        </Link>
      )}
    </div>
  );
}
