"use client";

import { useFormik } from "formik";
import { useState } from "react";
import { updateUserNameAction } from "@/src/actions/users.actions";

interface ProfileFormProps {
  userId: string;
  initialName: string;
  phone: string;
  /** Role names if any, otherwise the account type. See src/lib/labels.ts */
  roleLabel: string;
  parishName?: string | null;
}

export default function ProfileForm({ userId, initialName, phone, roleLabel, parishName }: ProfileFormProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { name: initialName },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.name.trim()) errors.name = "Name is required";
      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      setSuccessMsg(null);
      try {
        const res = await updateUserNameAction(userId, values.name);
        if (res.success) {
          setSuccessMsg("Profile updated successfully.");
        } else {
          setApiError(res.message || "Failed to update profile.");
        }
      } catch {
        setApiError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form className="space-y-6" onSubmit={formik.handleSubmit}>
      {successMsg && (
        <div
          className="p-3 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "rgba(22,163,74,0.1)", color: "#16a34a" }}
        >
          {successMsg}
        </div>
      )}
      {apiError && (
        <div
          className="p-3 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "rgba(168,56,54,0.1)", color: "#a83836" }}
        >
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#596065" }}>
            Display Name
          </label>
          <input
            className="w-full px-4 py-3 rounded-lg border font-medium outline-none transition-all"
            style={{
              borderColor: formik.touched.name && formik.errors.name ? "#a83836" : "#abb3b9",
              color: "#2c3338",
            }}
            name="name"
            type="text"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-xs" style={{ color: "#a83836" }}>{formik.errors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#596065" }}>
            Phone Number
          </label>
          <div className="relative">
            <input
              className="w-full px-4 py-3 rounded-lg border cursor-not-allowed font-medium pl-10 outline-none"
              style={{
                borderColor: "#dce3e9",
                backgroundColor: "#f0f4f8",
                color: "#596065",
              }}
              readOnly
              type="text"
              value={phone}
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              lock
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#596065" }}>
            Role
          </label>
          <div className="relative">
            <input
              className="w-full px-4 py-3 rounded-lg border cursor-not-allowed font-medium pl-10 outline-none"
              style={{
                borderColor: "#dce3e9",
                backgroundColor: "#f0f4f8",
                color: "#596065",
              }}
              readOnly
              type="text"
              value={roleLabel}
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              lock
            </span>
          </div>
        </div>
        {parishName && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#596065" }}>
              Parish
            </label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 rounded-lg border cursor-not-allowed font-medium pl-10 outline-none"
                style={{
                  borderColor: "#dce3e9",
                  backgroundColor: "#f0f4f8",
                  color: "#596065",
                }}
                readOnly
                type="text"
                value={parishName}
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                location_on
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="pt-4 flex justify-end">
        <button
          className="font-bold px-8 py-3 rounded-lg shadow-md hover:brightness-95 transition-all flex items-center space-x-2 disabled:opacity-60"
          style={{ backgroundColor: "#F59E0B", color: "#134e4a" }}
          type="submit"
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              Saving...
            </span>
          ) : (
            <>
              <span>Save Changes</span>
              <span className="material-symbols-outlined">check_circle</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
