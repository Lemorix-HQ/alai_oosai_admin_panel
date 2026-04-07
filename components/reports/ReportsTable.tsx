"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminReports, useDeleteReport } from "@/src/hooks/useReports";
import { Report } from "@/src/types";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

interface ReportsTableProps {
  initialReports: Report[];
}

export default function ReportsTable({ initialReports }: ReportsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [page, setPage] = useState(1);

  const { data: queryResult, isLoading } = useAdminReports();
  const deleteReport = useDeleteReport();

  const reports = queryResult?.data ?? initialReports;
  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = reports.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function handleDelete() {
    if (!deleteId) return;
    await deleteReport.mutateAsync(deleteId);
    setDeleteId(null);
    setDeleteTitle("");
  }

  return (
    <>
      <div
        className="bg-white rounded-xl shadow-sm border overflow-hidden"
        style={{ borderColor: "#f1f5f9" }}
      >
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">No reports found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="uppercase text-[11px] font-bold tracking-widest"
                  style={{ backgroundColor: "#f0f4f8", color: "#596065" }}
                >
                  <th className="px-6 py-4 border-b" style={{ borderColor: "#f1f5f9" }}>Title</th>
                  <th className="px-6 py-4 border-b" style={{ borderColor: "#f1f5f9" }}>Upload Date</th>
                  <th className="px-6 py-4 border-b text-center" style={{ borderColor: "#f1f5f9" }}>File</th>
                  <th className="px-6 py-4 border-b text-right" style={{ borderColor: "#f1f5f9" }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm" style={{ borderColor: "#f8fafc" }}>
                {paged.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold" style={{ color: "#134e4a" }}>
                        {report.title}
                      </p>
                      <p className="text-xs text-slate-500">{report.description}</p>
                    </td>
                    <td className="px-6 py-4 font-medium" style={{ color: "#596065" }}>
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {report.pdfUrl ? (
                        <a
                          href={report.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-9 h-9 rounded hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: "#fee2e2" }}
                          title="View PDF"
                        >
                          <span className="material-symbols-outlined" style={{ color: "#dc2626" }}>
                            picture_as_pdf
                          </span>
                        </a>
                      ) : (
                        <div className="inline-flex items-center justify-center w-9 h-9 rounded" style={{ backgroundColor: "#fee2e2" }}>
                          <span className="material-symbols-outlined" style={{ color: "#dc2626" }}>
                            picture_as_pdf
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/reports/${report.id}`}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-[#0D5C63]"
                          title="View"
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </Link>
                        <Link
                          href={`/reports/${report.id}/edit`}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          style={{ color: "#0f766e" }}
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </Link>
                        <button
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                          title="Delete"
                          onClick={() => {
                            setDeleteId(report.id);
                            setDeleteTitle(report.title);
                          }}
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between text-sm"
          style={{ backgroundColor: "rgba(248,250,252,0.5)", borderColor: "#f1f5f9" }}
        >
          <span className="text-slate-500 font-medium">
            Showing{" "}
            <span className="font-bold" style={{ color: "#0D5C63" }}>
              {reports.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, reports.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold" style={{ color: "#0D5C63" }}>
              {reports.length}
            </span>{" "}
            results
          </span>
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-1 font-bold disabled:text-slate-300 disabled:cursor-not-allowed"
              style={{ color: safePage <= 1 ? undefined : "#0D5C63" }}
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <span className="material-symbols-outlined">chevron_left</span>
              Prev
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className="h-8 w-8 rounded font-bold text-xs transition-colors"
                  style={
                    p === safePage
                      ? { backgroundColor: "#0D5C63", color: "#fff" }
                      : { backgroundColor: "#f1f5f9", color: "#596065" }
                  }
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              className="flex items-center gap-1 font-bold disabled:text-slate-300 disabled:cursor-not-allowed"
              style={{ color: safePage >= totalPages ? undefined : "#0D5C63" }}
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#fa746f" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#6e0a12" }}>
                  warning
                </span>
              </div>
              <h3 className="text-xl font-extrabold mb-2" style={{ color: "#2c3338" }}>
                Delete Report?
              </h3>
              <p style={{ color: "#596065" }} className="leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-bold" style={{ color: "#2c3338" }}>
                  {deleteTitle}
                </span>
                ? This action is permanent and cannot be undone.
              </p>
            </div>
            <div
              className="px-6 py-4 flex flex-col sm:flex-row-reverse gap-3"
              style={{ backgroundColor: "#f0f4f8" }}
            >
              <button
                className="w-full sm:w-auto px-6 py-2.5 font-bold rounded-lg shadow-md transition-colors text-white disabled:opacity-60"
                style={{ backgroundColor: "#a83836" }}
                disabled={deleteReport.isPending}
                onClick={handleDelete}
              >
                {deleteReport.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                className="w-full sm:w-auto px-6 py-2.5 font-bold border rounded-lg transition-colors"
                style={{ color: "#596065", borderColor: "#abb3b9" }}
                onClick={() => {
                  setDeleteId(null);
                  setDeleteTitle("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
