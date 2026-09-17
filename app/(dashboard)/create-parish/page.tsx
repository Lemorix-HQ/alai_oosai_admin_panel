"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { useState } from "react";
import { useCreateParish, useSwitchParish } from "@/hooks/useParishes";

export default function CreateParishPage() {
  const router = useRouter();
  const createParish = useCreateParish();
  const switchParish = useSwitchParish();
  const [apiError, setApiError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { name: "" },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.name.trim()) errors.name = "Parish name is required";
      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        const res = await createParish.mutateAsync({ name: values.name.trim() });
        if (!res.success || !res.data?._id) {
          setApiError(res.message || "Failed to create parish.");
          setSubmitting(false);
          return;
        }
        // Auto-assign the freshly created parish to the current super admin
        const switchRes = await switchParish.mutateAsync(res.data._id);
        if (!switchRes.success) {
          setApiError(switchRes.message || "Parish created but selection failed.");
          setSubmitting(false);
          return;
        }
        router.push("/");
      } catch {
        setApiError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const fieldError = (name: string) => {
    const touched = formik.touched as Record<string, boolean>;
    const errors = formik.errors as Record<string, string>;
    return touched[name] && errors[name] ? errors[name] : null;
  };

  return (
    <main className="pt-0 min-h-screen" style={{ backgroundColor: "#F5F7FA" }}>
      <div className="p-8 max-w-3xl mx-auto">
        <nav className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/select-parish" className="hover:underline" style={{ color: "#596065" }}>
            Parishes
          </Link>
          <span className="material-symbols-outlined text-xs" style={{ color: "#abb3b9" }}>
            chevron_right
          </span>
          <span className="font-semibold" style={{ color: "#0D5C63" }}>
            Create Parish
          </span>
        </nav>

        <div
          className="bg-white rounded-xl shadow-sm border overflow-hidden"
          style={{ borderColor: "#e2e8f0" }}
        >
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold" style={{ color: "#0D5C63" }}>
                Create New Parish
              </h3>
              <p className="text-slate-500 mt-1">
                Add a parish (tenant) to the platform. You can assign a parish admin from
                the global dashboard once it&apos;s created.
              </p>
            </div>

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
                  Parish Name <span style={{ color: "#a83836" }}>*</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-lg border outline-none transition-all"
                  style={{
                    borderColor: fieldError("name") ? "#a83836" : "#e2e8f0",
                  }}
                  name="name"
                  type="text"
                  placeholder="e.g. Alai Oosai"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {fieldError("name") && (
                  <p className="text-xs mt-1" style={{ color: "#a83836" }}>
                    {fieldError("name")}
                  </p>
                )}
              </div>

              <div
                className="pt-6 flex items-center justify-end gap-4 border-t"
                style={{ borderColor: "#f1f5f9" }}
              >
                <Link
                  href="/select-parish"
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
                      Creating...
                    </span>
                  ) : (
                    <>
                      Create Parish
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
