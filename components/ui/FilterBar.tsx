"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export interface FilterDef {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  /**
   * Wording for the unset option. Defaults to "<label>: All", which is right
   * where absent means no narrowing. Family status is the exception — absent
   * means active, because the API defaults the census to the living parish.
   */
  unsetLabel?: string;
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
    // Nothing in this row shrinks — a squeezed <select> crops its own label.
    // Past `sm` the row scrolls instead, and the search slides open over it.
    // `py-1` because `overflow-x-auto` would otherwise clip the input's focus
    // ring against the top and bottom edges.
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:items-center sm:overflow-x-auto sm:py-1">
      <div
        className="search-slide relative w-full shrink-0"
        // Held open while it has a term, so what was typed stays readable
        // after the pointer leaves.
        data-open={term ? "true" : undefined}
      >
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

      <div className="flex flex-wrap gap-2 sm:flex-nowrap shrink-0">
        {filters.map((f) => (
          // `field-sizing-content` sizes each select to the option actually
          // showing rather than to its widest one. Anbiyam carries 47 long
          // Tamil names, so on `: All` it was 328px of a row it never needed;
          // it now rests at 128px and grows to fit whatever is chosen. The
          // filters whose options are all short are unaffected — their widest
          // option already is the `: All` label. Browsers without the
          // property keep the old intrinsic width, which is what the
          // scrolling row already copes with.
          <select
            key={f.key}
            value={params.get(f.key) ?? ""}
            onChange={(e) => setFilter(f.key, e.target.value)}
            className="shrink-0 field-sizing-content px-3 py-2.5 rounded-lg border bg-white text-sm outline-none"
            style={{ borderColor: "#dce3e9" }}
          >
            <option value="">{f.unsetLabel ?? `${f.label}: All`}</option>
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
            className="shrink-0 whitespace-nowrap px-3 py-2.5 rounded-lg border bg-white text-sm font-medium"
            style={{ borderColor: "#dce3e9", color: "#0D5C63" }}
          >
            Clear ({active})
          </button>
        )}
      </div>
    </div>
  );
}
