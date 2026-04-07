"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAdminReports } from "@/src/hooks/useReports";
import { formatDate } from "@/lib/utils";

export default function ReportViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: result, isLoading } = useAdminReports();

  const report = result?.data?.find((r) => r.id === id);

  if (isLoading) {
    return (
      <main className="p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#F5F7FA" }}>
        <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
          Loading report details...
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#F5F7FA" }}>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <span className="material-symbols-outlined text-5xl text-slate-300">error</span>
          <p className="text-slate-400 font-medium">Report not found.</p>
          <Link href="/reports" className="font-bold text-sm" style={{ color: "#0D5C63" }}>
            Back to Reports
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#F5F7FA" }}>
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm font-medium mb-6" style={{ color: "#596065" }}>
        <Link href="/reports" className="hover:underline" style={{ color: "#596065" }}>
          Financial Reports
        </Link>
        <span className="mx-2" style={{ color: "#747c81" }}>/</span>
        <span className="font-bold" style={{ color: "#21686f" }}>Report Details</span>
      </nav>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border p-8" style={{ borderColor: "#e2e8f0" }}>
          <div className="flex items-start justify-between gap-4 mb-6 border-b pb-6" style={{ borderColor: "#f1f5f9" }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full" style={{ backgroundColor: "#fee2e2" }}>
                <span className="material-symbols-outlined" style={{ color: "#dc2626" }}>description</span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold" style={{ color: "#2c3338" }}>
                  {report.title}
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Uploaded {formatDate(report.createdAt)}
                </p>
              </div>
            </div>
            <Link
              href={`/reports/${report.id}/edit`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm transition-all hover:brightness-95 shrink-0"
              style={{ backgroundColor: "#0D5C63", color: "#ffffff" }}
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Edit
            </Link>
          </div>

          {report.description && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#596065" }}>
                {report.description}
              </p>
            </div>
          )}
        </div>

        {/* PDF Preview Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: "#e2e8f0" }}>
          <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4" style={{ color: "#596065" }}>
            PDF Document
          </h3>
          {report.pdfUrl ? (
            <div className="space-y-4">
              <div
                className="rounded-lg border p-6 flex flex-col items-center gap-4"
                style={{ borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
              >
                <div className="p-4 rounded-full" style={{ backgroundColor: "#fee2e2" }}>
                  <span className="material-symbols-outlined text-4xl" style={{ color: "#dc2626" }}>
                    picture_as_pdf
                  </span>
                </div>
                <p className="text-sm font-semibold" style={{ color: "#596065" }}>
                  Financial Report PDF
                </p>
                <a
                  href={report.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all hover:brightness-95"
                  style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
                >
                  <span className="material-symbols-outlined text-lg">open_in_new</span>
                  Open PDF
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No PDF attached.</p>
          )}
        </div>

        {/* Back Link */}
        <div>
          <Link
            href="/reports"
            className="flex items-center gap-1.5 font-bold text-sm hover:underline w-fit"
            style={{ color: "#596065" }}
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Reports
          </Link>
        </div>
      </div>
    </main>
  );
}
