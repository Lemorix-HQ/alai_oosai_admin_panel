"use client";

import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setPasswordSchema } from "@/src/validations/auth.validation";
import { acceptInvitationAction, resetPasswordAction } from "@/src/actions/auth.actions";

/**
 * Both links end in the same two fields. They differ only in where they go
 * afterwards: an invitation signs the person straight in, a reset sends them to
 * the login screen so the new password is proved once.
 */
export default function SetPasswordForm({ token, mode }: { token: string; mode: "invite" | "reset" }) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { password: "", confirm_password: "" },
    validationSchema: setPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        const res =
          mode === "invite"
            ? await acceptInvitationAction(token, values.password, values.confirm_password)
            : await resetPasswordAction(token, values.password, values.confirm_password);

        if (!res.success) {
          setApiError(res.message || "Something went wrong. Please try again.");
          return;
        }
        if (mode === "invite") router.push("/");
        else router.push("/login?reset=1");
      } catch {
        setApiError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const field = (name: "password" | "confirm_password", label: string, autoComplete: string) => (
    <div className="space-y-2">
      <label
        className="block text-xs font-bold uppercase tracking-wider"
        style={{ color: "#596065" }}
        htmlFor={name}
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="password"
        autoComplete={autoComplete}
        className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2"
        style={{ borderColor: "#abb3b9" }}
        value={formik.values[name]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      {formik.touched[name] && formik.errors[name] && (
        <p className="text-xs text-red-600">{formik.errors[name]}</p>
      )}
    </div>
  );

  return (
    <form className="space-y-5" onSubmit={formik.handleSubmit}>
      {field("password", "New password", "new-password")}
      {field("confirm_password", "Confirm password", "new-password")}
      <p className="text-xs" style={{ color: "#596065" }}>
        At least 8 characters, with one letter and one number.
      </p>
      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}
      <button
        type="submit"
        disabled={formik.isSubmitting}
        className="w-full py-3 rounded-lg text-white font-semibold text-sm disabled:opacity-60 cursor-pointer"
        style={{ backgroundColor: "#0d5c63" }}
      >
        {formik.isSubmitting ? "Saving…" : mode === "invite" ? "Set password and continue" : "Change password"}
      </button>
    </form>
  );
}
