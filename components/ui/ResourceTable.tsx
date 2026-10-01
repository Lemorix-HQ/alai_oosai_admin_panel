"use client";

import Link from "next/link";
import EmptyState from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  /** Cell renderer. Keep it pure — this runs for every row. */
  render: (row: T) => React.ReactNode;
  /** Hidden below sm, for columns that are useful but not essential. */
  secondary?: boolean;
  className?: string;
}

/**
 * One table used by every list page.
 *
 * Below `sm` it renders cards instead of a table. A horizontally scrolling
 * table on a phone is technically responsive and practically unusable, and
 * faculty will be using this at someone's front door.
 */
export default function ResourceTable<T extends { _id: string }>({
  rows,
  columns,
  rowHref,
  empty,
  primaryKey = columns[0]?.key,
}: {
  rows: T[];
  columns: Column<T>[];
  rowHref?: (row: T) => string;
  empty: { title: string; description?: string; icon?: string; action?: { href: string; label: string } };
  /** Column used as the card title on small screens. */
  primaryKey?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border" style={{ borderColor: "#e2e8f0" }}>
        <EmptyState {...empty} />
      </div>
    );
  }

  const primary = columns.find((c) => c.key === primaryKey) ?? columns[0];
  const rest = columns.filter((c) => c.key !== primary.key);

  return (
    <>
      {/* Cards — small screens */}
      <div className="grid gap-3 sm:hidden">
        {rows.map((row) => {
          const body = (
            <div
              className="bg-white rounded-xl border p-4 space-y-2"
              style={{ borderColor: "#e2e8f0" }}
            >
              <div className="font-bold text-sm" style={{ color: "#0D5C63" }}>
                {primary.render(row)}
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {rest.map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      {c.header}
                    </dt>
                    <dd className="text-sm text-slate-700 truncate">{c.render(row)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
          return rowHref ? (
            <Link key={row._id} href={rowHref(row)} className="block">
              {body}
            </Link>
          ) : (
            <div key={row._id}>{body}</div>
          );
        })}
      </div>

      {/* Table — sm and up */}
      <div
        className="hidden sm:block bg-white rounded-xl border overflow-hidden"
        style={{ borderColor: "#e2e8f0" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 ${
                      c.secondary ? "hidden lg:table-cell" : ""
                    } ${c.className ?? ""}`}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row._id}
                  className="border-t hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3 align-middle ${
                        c.secondary ? "hidden lg:table-cell" : ""
                      } ${c.className ?? ""}`}
                    >
                      {rowHref && c.key === primary.key ? (
                        <Link
                          href={rowHref(row)}
                          className="font-semibold hover:underline"
                          style={{ color: "#0D5C63" }}
                        >
                          {c.render(row)}
                        </Link>
                      ) : (
                        c.render(row)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
