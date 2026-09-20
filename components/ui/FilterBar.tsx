"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export interface FilterDef {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

/**
 * Search and faceted filters, held in the URL.
 *
 * URL state rather than component state so a filtered list can be bookmarked,
 * shared with a colleague, and survives a back navigation — all of which
 * matter when someone is working through 1,800 families over several sittings.
 */
export default function FilterBar({
  searchPlaceholder = "Search…",
  filters = [],
}: {
  searchPlaceholder?: string;
  filters?: FilterDef[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [term, setTerm] = useState(params.get("q") ?? "");

  // Debounce so a query does not fire on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (term) next.set("q", term);
      else next.delete("q");
      next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const active = filters.filter((f) => params.get(f.key)).length + (params.get("q") ? 1 : 0);

  return (
    <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center">
      <div className="relative flex-1 min-w-0">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
          search
        </span>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-3 py-2.5 rounded-lg border bg-white text-sm outline-none focus:ring-2"
          style={{ borderColor: "#dce3e9" }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <select
            key={f.key}
            value={params.get(f.key) ?? ""}
            onChange={(e) => setFilter(f.key, e.target.value)}
            className="px-3 py-2.5 rounded-lg border bg-white text-sm outline-none"
            style={{ borderColor: "#dce3e9" }}
          >
            <option value="">{f.label}: All</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        {active > 0 && (
          <button
            onClick={() => {
              setTerm("");
              router.replace(pathname, { scroll: false });
            }}
            className="px-3 py-2.5 rounded-lg border bg-white text-sm font-medium"
            style={{ borderColor: "#dce3e9", color: "#0D5C63" }}
          >
            Clear ({active})
          </button>
        )}
      </div>
    </div>
  );
}
