"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { useRef, useState } from "react";
import { createReportAction } from "@/src/actions/reports.actions";
import { useQueryClient } from "@tanstack/react-query";
import TamilInput from "@/components/ui/TamilInput";
import TamilTextarea from "@/components/ui/TamilTextarea";
import LanguageToggle from "@/components/ui/LanguageToggle";

export default function NewReportPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [tamilMode, setTamilMode] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.title) errors.title = "Report title is required";
      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      setPdfError(null);
      if (!pdfFile) {
        setPdfError("Please select a PDF file to upload.");
        setSubmitting(false);
        return;
      }
      try {
        const formData = new FormData();
        formData.append("title", values.title);
        if (values.description) formData.append("description", values.description);
        formData.append("pdf", pdfFile);

        const res = await createReportAction(formData);
        if (res.success) {
          queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
          router.push("/reports");
        } else {
          setApiError(res.message || "Failed to upload report.");
        }
      } catch {
        setApiError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setPdfError("File exceeds 20MB limit.");
      return;
    }
    setPdfError(null);
    setPdfFile(file);
  }

  const fieldError = (name: string) => {
    const touched = formik.touched as Record<string, boolean>;
    const errors = formik.errors as Record<string, string>;
    return touched[name] && errors[name] ? errors[name] : null;
  };

  return (
    <main className="pt-0 min-h-screen" style={{ backgroundColor: "#F5F7FA" }}>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/reports" className="hover:underline" style={{ color: "#596065" }}>
            Reports
          </Link>
          <span className="material-symbols-outlined text-xs" style={{ color: "#abb3b9" }}>
            chevron_right
          </span>
          <span className="font-semibold" style={{ color: "#0D5C63" }}>
            Upload Report
          </span>
        </nav>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Form Section */}
          <div className="col-span-12 lg:col-span-8">
            <div
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
              style={{ borderColor: "#e2e8f0" }}
            >
              <div className="p-8">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold" style={{ color: "#0D5C63" }}>
                    Upload Financial Report
                  </h3>
                  <p className="text-slate-500 mt-1">
                    Fill in the details below to publish a new financial statement to the dashboard.
                  </p>
                </div>

                <LanguageToggle tamilMode={tamilMode} onToggle={() => setTamilMode(!tamilMode)} />

                {apiError && (
                  <div
                    className="p-3 rounded-lg text-sm font-medium mb-6"
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
                      className="w-full px-4 py-3 rounded-lg border outline-none transition-all"
                      style={{
                        borderColor: fieldError("title") ? "#a83836" : "#e2e8f0",
                      }}
                      name="title"
                      placeholder="e.g. Monthly Income Report March 2025"
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
                      Description{" "}
                      <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <TamilTextarea
                      tamilMode={tamilMode}
                      className="w-full px-4 py-3 rounded-lg border outline-none transition-all resize-none"
                      style={{ borderColor: "#e2e8f0" }}
                      name="description"
                      placeholder="Brief summary of this financial report..."
                      rows={3}
                      value={formik.values.description}
                      onChange={formik.handleChange}
                    />
                  </div>

                  {/* Upload Zone */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-700">
                      PDF File <span style={{ color: "#a83836" }}>*</span>
                    </label>
                    <div
                      className="border-2 border-dashed rounded-xl p-10 text-center flex flex-col items-center cursor-pointer hover:border-red-300 transition-all"
                      style={{
                        borderColor: pdfError ? "#a83836" : "#fecaca",
                        backgroundColor: "rgba(254,242,242,0.3)",
                      }}
                      onClick={() => fileRef.current?.click()}
                    >
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl" style={{ color: "#ef4444" }}>
                          picture_as_pdf
                        </span>
                      </div>
                      {pdfFile ? (
                        <>
                          <h4 className="text-slate-800 font-bold text-lg">{pdfFile.name}</h4>
                          <p className="text-slate-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-slate-800 font-bold text-lg">
                            Drag & drop your PDF report here
                          </h4>
                          <p className="text-slate-500 mb-6">or click to browse</p>
                          <p
                            className="text-xs text-slate-400 font-medium bg-white px-3 py-1 rounded-full border shadow-sm mb-6"
                            style={{ borderColor: "#f1f5f9" }}
                          >
                            Accepts: PDF only • Max 20MB
                          </p>
                        </>
                      )}
                      <button
                        className="text-slate-900 font-bold px-8 py-3 rounded-lg hover:shadow-lg active:scale-95 transition-all mt-4"
                        style={{ backgroundColor: "#F59E0B" }}
                        type="button"
                      >
                        {pdfFile ? "Change File" : "Browse File"}
                      </button>
                      <input
                        ref={fileRef}
                        className="hidden"
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                      />
                    </div>
                    {pdfError && (
                      <p className="text-xs" style={{ color: "#a83836" }}>{pdfError}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div
                    className="pt-6 flex items-center justify-end gap-4 border-t"
                    style={{ borderColor: "#f1f5f9" }}
                  >
                    <Link
                      href="/reports"
                      className="px-6 py-3 font-semibold border border-transparent hover:border-current rounded-lg transition-all"
                      style={{ color: "#0D5C63" }}
                    >
                      Cancel
                    </Link>
                    <button
                      className="text-slate-900 font-bold px-8 py-3 rounded-lg shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#F59E0B" }}
                      type="submit"
                      disabled={formik.isSubmitting}
                    >
                      {formik.isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                          Uploading...
                        </span>
                      ) : (
                        <>
                          Upload Report
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div
              className="rounded-xl p-6 text-white shadow-lg overflow-hidden relative"
              style={{ backgroundColor: "#0D5C63" }}
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ color: "#F59E0B" }}>
                    info
                  </span>
                  Upload Guidelines
                </h4>
                <ul className="space-y-4 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                  <li className="flex gap-3">
                    <span className="material-symbols-outlined text-sm mt-0.5" style={{ color: "#F59E0B" }}>
                      check_circle
                    </span>
                    Ensure the PDF is not password protected.
                  </li>
                  <li className="flex gap-3">
                    <span className="material-symbols-outlined text-sm mt-0.5" style={{ color: "#F59E0B" }}>
                      check_circle
                    </span>
                    Financial figures must match the audit trail.
                  </li>
                  <li className="flex gap-3">
                    <span className="material-symbols-outlined text-sm mt-0.5" style={{ color: "#F59E0B" }}>
                      check_circle
                    </span>
                    Use clear, standard naming conventions.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
