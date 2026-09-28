"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import Link from "next/link";
import { Suspense, useState } from "react";
import { emailLoginSchema } from "@/src/validations/auth.validation";
import { loginAction } from "@/src/actions/auth.actions";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [apiError, setApiError] = useState<string | null>(null);
  const justReset = params.get("reset") === "1";

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: emailLoginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        const res = await loginAction(values.email, values.password);
        if (res.success) router.push(params.get("next") ?? "/");
        else setApiError(res.message || "Could not sign you in. Please try again.");
      } catch {
        setApiError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form className="w-full space-y-5" onSubmit={formik.handleSubmit}>
      {justReset && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Password updated. Sign in with your new password.
        </p>
      )}

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

      <div className="space-y-2">
        <label
          className="block text-xs font-bold uppercase tracking-wider"
          style={{ color: "#596065" }}
          htmlFor="password"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: "#abb3b9" }}
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        {formik.touched.password && formik.errors.password && (
          <p className="text-xs text-red-600">{formik.errors.password}</p>
        )}
      </div>

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
        {formik.isSubmitting ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center">
        <Link href="/forgot-password" className="text-xs font-medium underline" style={{ color: "#0d5c63" }}>
          Forgot password?
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-login-gradient min-h-screen flex items-center justify-center p-6">
      <main className="w-full max-w-[400px] bg-white rounded-lg shadow-2xl p-10 flex flex-col items-center">
        <header className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-inner"
            style={{ backgroundColor: "#0d5c63" }}
          >
            <span className="text-white font-extrabold text-lg tracking-tighter">AO</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0d5c63" }}>
            Alai Oosai Admin
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: "#596065" }}>
            Parish Admin Portal
          </p>
        </header>
        {/* useSearchParams needs a boundary during prerender. */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
