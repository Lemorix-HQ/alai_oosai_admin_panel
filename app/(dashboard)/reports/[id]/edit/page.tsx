"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useFormik } from "formik";
import { useState } from "react";
import { useAdminReports, useUpdateReport, useDeleteReport } from "@/src/hooks/useReports";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import TamilInput from "@/components/ui/TamilInput";
import TamilTextarea from "@/components/ui/TamilTextarea";
import LanguageToggle from "@/components/ui/LanguageToggle";

export default function EditReportPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [apiError, setApiError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tamilMode, setTamilMode] = useState(true);

  // Backend has no GET /reports/:id — load from admin list and filter
  const { data: listResult, isLoading } = useAdminReports();
  const updateReport = useUpdateReport(id);
  const deleteReport = useDeleteReport();

  const report = listResult?.data?.find((r) => r.id === id);

  const formik = useFormik({
    initialValues: {
      title: report?.title ?? "",
      description: report?.description ?? "",
    },
    enableReinitialize: true,
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.title) errors.title = "Report title is required";
      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        const res = await updateReport.mutateAsync({
          title: values.title,
          ...(values.description ? { description: values.description } : {}),
        });
        if (res.success) {
          router.push("/reports");
        } else {
          setApiError(res.message || "Failed to update report.");
        }
      } catch {
        setApiError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  async function handleDelete() {
    await deleteReport.mutateAsync(id);
    queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    router.push("/reports");
  }

  const fieldError = (name: string) => {
    const touched = formik.touched as Record<string, boolean>;
    const errors = formik.errors as Record<string, string>;
    return touched[name] && errors[name] ? errors[name] : null;
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#0D5C63", borderTopColor: "transparent" }}></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8">
        <p className="text-red-600 font-semibold">Report not found.</p>
        <Link href="/reports" className="text-teal-700 hover:underline mt-2 inline-block">← Back to Reports</Link>
      </div>
    );
  }

  return (
    <main className="p-8 min-h-screen" style={{ backgroundColor: "#F5F7FA" }}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center text-sm font-medium" style={{ color: "#596065" }}>
        <Link href="/reports" className="hover:underline transition-colors">
          Reports
        </Link>
        <span className="mx-2" style={{ color: "#abb3b9" }}>/</span>
        <span style={{ color: "#2c3338" }}>Edit Report</span>
      </nav>

      <div className="max-w-5xl mx-auto grid grid-cols-12 gap-6">
        {/* Main Form */}
        <div className="col-span-12 lg:col-span-8">
          <div
            className="bg-white rounded-xl shadow-sm border overflow-hidden"
            style={{ borderColor: "#e2e8f0" }}
          >
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "#e2e8f0" }}>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold" style={{ color: "#0d5c63" }}>
                  Edit Financial Report
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ backgroundColor: "#abeef6", color: "#0a5b62" }}
                >
                  Editing
                </span>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <LanguageToggle tamilMode={tamilMode} onToggle={() => setTamilMode(!tamilMode)} />
              {apiError && (
                <div
                  className="p-3 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: "rgba(168,56,54,0.1)", color: "#a83836" }}
                >
                  {apiError}
                </div>
              )}

              <form className="space-y-6" onSubmit={formik.handleSubmit}>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Report Title <span style={{ color: "#a83836" }}>*</span>
                  </label>
                  <TamilInput
                    tamilMode={tamilMode}
                    className="w-full px-4 py-3 rounded-lg border outline-none"
                    style={{
                      borderColor: fieldError("title") ? "#a83836" : "#e2e8f0",
                      backgroundColor: "#ffffff",
                    }}
                    name="title"
                    type="text"
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {fieldError("title") && (
                    <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("title")}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description
                  </label>
                  <TamilTextarea
                    tamilMode={tamilMode}
                    className="w-full px-4 py-3 rounded-lg border outline-none resize-none"
                    style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}
                    name="description"
                    rows={3}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                  />
                </div>

                {/* Current File (read-only — PDF replacement not supported on edit) */}
                {report.pdfUrl && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Attached PDF
                    </label>
                    <div
                      className="flex items-center gap-4 p-4 rounded-lg border"
                      style={{ backgroundColor: "#f8fafc", borderColor: "#f1f5f9" }}
                    >
                      <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center">
                        <span className="material-symbols-outlined" style={{ color: "#ef4444" }}>
                          picture_as_pdf
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">Current PDF</p>
                        <p className="text-xs text-slate-500">Uploaded: {formatDate(report.createdAt)}</p>
                      </div>
                      <a
                        href={report.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-teal-700 transition-colors p-2 rounded"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </a>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">PDF file cannot be replaced after upload.</p>
                  </div>
                )}

                {/* Actions */}
                <div
                  className="pt-6 flex items-center justify-between border-t"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <button
                    className="px-6 py-2.5 font-bold border rounded-lg transition-colors"
                    style={{ color: "#0d5c63", borderColor: "#0d5c63" }}
                    type="button"
                    onClick={() => router.push("/reports")}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-8 py-2.5 font-extrabold rounded-lg shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                    style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
                    type="submit"
                    disabled={formik.isSubmitting}
                  >
                    {formik.isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        Updating...
                      </span>
                    ) : (
                      <>
                        Update Report
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-4 px-2">
            <button
              className="flex items-center gap-2 font-semibold hover:underline"
              style={{ color: "#a83836" }}
              onClick={() => setShowDeleteModal(true)}
            >
              <span className="material-symbols-outlined">delete</span>
              Delete this report
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: "#e2e8f0" }}>
            <h4 className="font-bold text-sm mb-3 uppercase tracking-wider" style={{ color: "#596065" }}>
              Report Info
            </h4>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt style={{ color: "#596065" }}>Uploaded</dt>
                <dd className="font-bold" style={{ color: "#2c3338" }}>{formatDate(report.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
              <p className="leading-relaxed" style={{ color: "#596065" }}>
                Are you sure you want to delete{" "}
                <span className="font-bold" style={{ color: "#2c3338" }}>
                  {report.title}
                </span>
                ? This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 flex flex-col sm:flex-row-reverse gap-3" style={{ backgroundColor: "#f0f4f8" }}>
              <button
                className="w-full sm:w-auto px-6 py-2.5 font-bold rounded-lg shadow-md text-white disabled:opacity-60"
                style={{ backgroundColor: "#a83836" }}
                disabled={deleteReport.isPending}
                onClick={handleDelete}
              >
                {deleteReport.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                className="w-full sm:w-auto px-6 py-2.5 font-bold border rounded-lg"
                style={{ color: "#596065", borderColor: "#abb3b9" }}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
