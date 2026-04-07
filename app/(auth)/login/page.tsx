"use client";

import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { loginSchema } from "@/src/validations/auth.validation";
import { sendOtpAction } from "@/src/actions/auth.actions";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { phone_number: "" },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        const res = await sendOtpAction(values.phone_number);
        if (res.success) {
          sessionStorage.setItem("otp_phone", values.phone_number);
          router.push("/verify-otp");
        } else {
          setApiError(res.message || "Failed to send OTP. Please try again.");
        }
      } catch {
        setApiError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="bg-login-gradient min-h-screen flex items-center justify-center p-6">
      {/* Login Container */}
      <main className="w-full max-w-[400px] bg-white rounded-lg shadow-2xl p-10 flex flex-col items-center">
        {/* App Logo Area */}
        <header className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-inner"
            style={{ backgroundColor: "#0d5c63" }}
          >
            <span className="text-white font-extrabold text-lg tracking-tighter">AO</span>
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#0d5c63" }}
          >
            Alai Oosai Admin
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: "#596065" }}>
            Village Admin Portal
          </p>
        </header>

        {/* Login Form */}
        <form className="w-full space-y-6" onSubmit={formik.handleSubmit}>
          <div className="space-y-2">
            <label
              className="block text-xs font-bold uppercase tracking-wider"
              style={{ color: "#596065" }}
              htmlFor="phone_number"
            >
              Phone Number
            </label>
            <div className="relative flex items-center">
              {/* Prefix Badge */}
              <div
                className="flex items-center justify-center px-4 py-3 border border-r-0 rounded-l-lg font-semibold text-sm"
                style={{
                  backgroundColor: "#f0f4f8",
                  borderColor: "#abb3b9",
                  color: "#596065",
                }}
              >
                +91
              </div>
              {/* Input Field */}
              <input
                className="w-full px-4 py-3 border rounded-r-lg outline-none text-sm transition-all"
                style={{
                  borderColor:
                    formik.touched.phone_number && formik.errors.phone_number
                      ? "#a83836"
                      : "#abb3b9",
                  color: "#2c3338",
                }}
                id="phone_number"
                name="phone_number"
                placeholder="Enter your mobile number"
                type="tel"
                value={formik.values.phone_number}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            {formik.touched.phone_number && formik.errors.phone_number && (
              <p className="text-xs mt-1" style={{ color: "#a83836" }}>
                {formik.errors.phone_number}
              </p>
            )}
          </div>

          {apiError && (
            <div
              className="p-3 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "rgba(168,56,54,0.1)", color: "#a83836" }}
            >
              {apiError}
            </div>
          )}

          {/* CTA Button */}
          <button
            className="group w-full font-bold py-3.5 px-4 rounded-lg flex items-center justify-center transition-all duration-200 shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#865400", color: "#5b3700" }}
            type="submit"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                Sending OTP...
              </span>
            ) : (
              <>
                <span className="mr-2">Send OTP</span>
                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        {/* Decorative Element */}
        <div className="mt-8 mb-6 w-full flex items-center gap-4">
          <div
            className="h-px flex-grow"
            style={{ backgroundColor: "#dce3e9" }}
          ></div>
          <span
            className="text-[10px] uppercase tracking-[0.2em] font-bold"
            style={{ color: "#747c81" }}
          >
            Secure Access
          </span>
          <div
            className="h-px flex-grow"
            style={{ backgroundColor: "#dce3e9" }}
          ></div>
        </div>

        {/* Footer */}
        <footer className="text-center">
          <p className="text-xs font-medium" style={{ color: "#747c81" }}>
            Alai Oosai © 2025
          </p>
        </footer>
      </main>

      {/* Visual Background Enhancements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10 opacity-20">
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full"
          style={{
            backgroundColor: "#21686f",
            filter: "blur(100px)",
          }}
        ></div>
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full"
          style={{
            backgroundColor: "#ffddb8",
            filter: "blur(100px)",
          }}
        ></div>
      </div>
    </div>
  );
}
