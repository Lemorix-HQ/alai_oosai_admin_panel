"use client";

import { useRouter } from "next/navigation";
import {
  useRef,
  KeyboardEvent,
  ChangeEvent,
  useState,
  useEffect,
} from "react";
import Link from "next/link";
import { useFormik } from "formik";
import { otpSchema } from "@/src/validations/auth.validation";
import { verifyOtpAction, sendOtpAction } from "@/src/actions/auth.actions";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [phone, setPhone] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("otp_phone");
    if (stored) setPhone(stored);
  }, []);

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formik = useFormik({
    initialValues: { otp: 0 },
    validationSchema: otpSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        const res = await verifyOtpAction(phone, values.otp);
        console.log("res",res)
        if (res.success) {
          sessionStorage.removeItem("otp_phone");
          console.log("redirection")
          router.push("/");
        } else {
          setApiError(res.message || "Invalid OTP. Please try again.");
        }
      } catch {
        setApiError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  function handleDigitChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Assemble OTP and set in formik
    const assembled = newDigits.join("");
    if (assembled.length === 6) {
      formik.setFieldValue("otp", parseInt(assembled, 10));
    } else {
      formik.setFieldValue("otp", 0);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleResend() {
    if (!canResend) return;
    setResendLoading(true);
    try {
      await sendOtpAction(phone);
      setTimer(30);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      formik.setFieldValue("otp", 0);
    } finally {
      setResendLoading(false);
    }
  }

  const maskedPhone = phone
    ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`
    : "+91 XXXXX XXXXX";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(to bottom right, #0D5C63, #084047)" }}
    >
      {/* Main Verification Card */}
      <main className="w-full max-w-[400px] bg-white rounded-lg shadow-2xl p-10 flex flex-col items-start overflow-hidden relative">
        {/* Back Link Section */}
        <Link
          className="flex items-center text-sm font-medium mb-8 group transition-colors"
          style={{ color: "#0d5c63" }}
          href="/login"
        >
          <span className="material-symbols-outlined text-sm mr-1 transition-transform group-hover:-translate-x-1">
            arrow_back
          </span>
          Change number
        </Link>

        {/* Content Header */}
        <header className="w-full mb-8">
          <h1
            className="text-2xl font-bold mb-2 tracking-tight"
            style={{ color: "#0d5c63" }}
          >
            Verify Your Phone
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#596065" }}>
            Enter the 6-digit OTP sent to{" "}
            <span className="font-semibold" style={{ color: "#2c3338" }}>
              {maskedPhone}
            </span>
          </p>
        </header>

        {/* OTP Input Section */}
        <form className="w-full" onSubmit={formik.handleSubmit}>
          <div
            aria-label="OTP Input Fields"
            className="flex justify-between items-center gap-2 mb-2"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                className="otp-input w-[52px] h-[60px] text-center text-xl font-bold border rounded-lg"
                style={{
                  borderColor:
                    formik.touched.otp && formik.errors.otp
                      ? "#a83836"
                      : "#abb3b9",
                  backgroundColor: "#ffffff",
                  color: "#0d5c63",
                }}
                maxLength={1}
                placeholder="•"
                type="text"
                inputMode="numeric"
                value={otpDigits[i]}
                onChange={(e) => handleDigitChange(i, e)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>

          {formik.touched.otp && formik.errors.otp && (
            <p className="text-xs mb-4" style={{ color: "#a83836" }}>
              {formik.errors.otp as string}
            </p>
          )}

          {apiError && (
            <div
              className="p-3 rounded-lg text-sm font-medium mb-4"
              style={{ backgroundColor: "rgba(168,56,54,0.1)", color: "#a83836" }}
            >
              {apiError}
            </div>
          )}

          {/* Resend Action Section */}
          <div className="w-full text-center mb-8 mt-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-medium" style={{ color: "#596065" }}>
                {canResend ? "" : `Resend OTP in 0:${timer.toString().padStart(2, "0")}`}
              </span>
              <button
                className="text-sm font-semibold transition-colors"
                style={{
                  color: canResend ? "#865400" : "#abb3b9",
                  cursor: canResend ? "pointer" : "not-allowed",
                }}
                disabled={!canResend || resendLoading}
                type="button"
                onClick={handleResend}
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            </div>
          </div>

          {/* Primary CTA Button */}
          <button
            className="w-full font-bold py-4 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#865400", color: "#744800" }}
            type="submit"
            disabled={formik.isSubmitting || otpDigits.join("").length < 6}
          >
            {formik.isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                Verifying...
              </span>
            ) : (
              <>
                Verify OTP
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Bottom Decorative / Brand Element */}
        <div
          className="mt-8 pt-8 border-t w-full flex justify-center"
          style={{ borderColor: "#dce3e9" }}
        >
          <div className="flex items-center gap-2 opacity-40">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#0d5c63" }}
            ></span>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#0d5c63" }}
            ></span>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#0d5c63" }}
            ></span>
          </div>
        </div>
      </main>

      {/* Aesthetic Background Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-black/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
}
