import Link from "next/link";

/**
 * Standard page frame: title, optional subtitle, optional primary action.
 * Owns the page padding so AppShell does not have to — existing pages bring
 * their own and would otherwise double up.
 */
export default function PageShell({
  title,
  subtitle,
  action,
  breadcrumb,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string; icon?: string } | React.ReactNode;
  breadcrumb?: Array<{ href?: string; label: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 sm:p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#f7f9fc" }}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500">
          {breadcrumb.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <span className="material-symbols-outlined text-[14px]">chevron_right</span>}
              {c.href ? (
                <Link href={c.href} className="hover:underline" style={{ color: "#0D5C63" }}>
                  {c.label}
                </Link>
              ) : (
                <span>{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black truncate" style={{ color: "#0D5C63" }}>
            {title}
          </h1>
          {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
        </div>
        {action &&
          (typeof action === "object" && action !== null && "href" in action ? (
            <Link
              href={(action as { href: string }).href}
              className="font-bold py-2.5 px-5 rounded-lg inline-flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 shrink-0"
              style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
            >
              <span className="material-symbols-outlined text-[20px]">
                {(action as { icon?: string }).icon ?? "add"}
              </span>
              {(action as { label: string }).label}
            </Link>
          ) : (
            action
          ))}
      </div>

      {children}
    </div>
  );
}
