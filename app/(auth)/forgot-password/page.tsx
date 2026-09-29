"use client";

import Link from "next/link";
import { useFormik } from "formik";
import { useState } from "react";
import AuthCard from "@/components/access/AuthCard";
import { forgotPasswordSchema } from "@/src/validations/auth.validation";
import { forgotPasswordAction } from "@/src/actions/auth.actions";

export default function ForgotPasswordPage() {
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      try {
        const res = await forgotPasswordAction(values.email);
        // A throttled request (10/min) or an unreachable API arrives here as
        // success:false with the error text. Showing that under "Check your
        // email" tells somebody a link is coming when nothing was sent.
        //
        // Separating the two costs no enumeration protection: the server
        // already returns one identical message for known and unknown
        // addresses, so only genuine failures land here.
        if (!res.success) {
          setError(res.message || "Could not send the link. Please try again.");
          return;
        }
        setDone(
          res.message ||
            "If that address belongs to an administrator account, a reset link is on its way."
        );
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (done) {
    return (
      <AuthCard title="Check your email">
        <p className="text-sm text-center" style={{ color: "#596065" }}>{done}</p>
        <p className="text-center mt-6">
          <Link href="/login" className="text-xs font-medium underline" style={{ color: "#0d5c63" }}>
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="We will email you a link to choose a new one.">
      <form className="space-y-5" onSubmit={formik.handleSubmit}>
        <div className="space-y-2">
          <label
            className="block text-xs font-bold uppercase tracking-wider"
            style={{ color: "#596065" }}
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: "#abb3b9" }}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.email && formik.errors.email && (
            <p className="text-xs text-red-600">{formik.errors.email}</p>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={formik.isSubmitting}
          className="w-full py-3 rounded-lg text-white font-semibold text-sm disabled:opacity-60 cursor-pointer"
          style={{ backgroundColor: "#0d5c63" }}
        >
          {formik.isSubmitting ? "Sending…" : "Send reset link"}
        </button>
        <p className="text-center">
          <Link href="/login" className="text-xs font-medium underline" style={{ color: "#0d5c63" }}>
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
