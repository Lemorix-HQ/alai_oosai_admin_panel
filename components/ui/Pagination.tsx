"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Page state lives in the URL, like the filters, so a position is shareable. */
export default function Pagination({
  page,
  pages,
  total,
  shown,
}: {
  page: number;
  pages: number;
  total: number;
  shown: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function go(next: number) {
    const q = new URLSearchParams(params.toString());
    if (next <= 1) q.delete("page");
    else q.set("page", String(next));
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  if (total === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        Showing {shown.toLocaleString()} of {total.toLocaleString()}
        {pages > 1 ? ` · page ${page} of ${pages}` : ""}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => go(page - 1)}
            disabled={page <= 1}
            className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-40"
            style={{ borderColor: "#dce3e9", color: "#0D5C63" }}
          >
            Previous
          </button>
          <button
            onClick={() => go(page + 1)}
            disabled={page >= pages}
            className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-40"
            style={{ borderColor: "#dce3e9", color: "#0D5C63" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
