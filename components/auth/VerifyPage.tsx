"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, MailOpen } from "lucide-react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { VerifyOtpSchema, verifyOtpSchema } from "@/lib/schemas/auth.schema";
import { useForm } from "react-hook-form";
import { resendVerificationOTP, verifyEmail } from "@/app/actions/auth/verify";

const CODE_LENGTH = 6;
const EXPIRY_SECONDS = 5 * 60; // 5 minutes

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [seconds, setSeconds] = useState(EXPIRY_SECONDS);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isExpired = seconds <= 0;

  const verifyOtpForm = useForm<VerifyOtpSchema>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { otp: "" },
  });

  const otp = verifyOtpForm.watch("otp");
  const digits = otp.padEnd(CODE_LENGTH, " ").split("").slice(0, CODE_LENGTH);
  const isFilled = otp.length === CODE_LENGTH;

  // Countdown timer
  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const setOtpValue = (value: string) => {
    verifyOtpForm.setValue("otp", value, { shouldValidate: true });
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const chars = otp.padEnd(CODE_LENGTH, " ").split("");
    chars[index] = value.slice(-1) || " ";
    const updated = chars.join("").trimEnd();
    setOtpValue(updated);
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;
    setOtpValue(pasted);
    const nextIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleResend = async () => {
    try {
      if (!email) return;
      const result = await resendVerificationOTP(email);
      if (!result.success) {
        verifyOtpForm.setError("otp", { message: result.error });
        return;
      }
      verifyOtpForm.reset({ otp: "" });
      setSeconds(EXPIRY_SECONDS);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error("Failed to send verification OTP:", error);
    }
  };

  const onVerifyOtpSubmit = async (data: VerifyOtpSchema) => {
    try {
      if (!email) {
        verifyOtpForm.setError("otp", { message: "Email not found. Please sign up again." });
        return;
      }
      const result = await verifyEmail(email, data.otp);
      if (!result.success) {
        verifyOtpForm.setError("otp", { message: result.error });
        return;
      }
      router.push("/chats");
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      // Optionally display error to user
    }
  };

  return (
    <form onSubmit={verifyOtpForm.handleSubmit(onVerifyOtpSubmit)}>
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-(--color-brand-50) flex items-center justify-center">
          <MailOpen size={30} className="text-(--color-brand-800)" />
        </div>
      </div>

      {/* Email line */}
      <p className="text-center text-sm text-(--color-text-secondary) leading-relaxed mb-7">
        We sent a 6-digit code to
        <br />
        <span className="text-(--color-text-primary) font-semibold">
          {email ?? "your email address"}
        </span>
      </p>

      {/* Code inputs */}
      <div
        className="flex gap-2 justify-center mb-3"
        onPaste={handlePaste}
        role="group"
        aria-label="Verification code"
      >
        {digits.map((digit, i) => {
          const isActive = focusedIndex === i;
          return (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit.trim()}
              aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() =>
                setFocusedIndex((current) => (current === i ? null : current))
              }
              className={`w-11 h-14 text-center text-xl font-semibold rounded-lg border bg-transparent focus:outline-none transition-all
                ${
                  isActive
                    ? "border-(--color-brand-400) ring-2 ring-(--color-brand-50)"
                    : "border-(--color-border-secondary)"
                }`}
            />
          );
        })}
      </div>

      {verifyOtpForm.formState.errors.otp && (
        <p className="text-sm text-(--color-coral-400) text-center mb-3">
          {verifyOtpForm.formState.errors.otp.message}
        </p>
      )}

      {/* Timer / expiry message */}
      {isExpired ? (
        <p className="text-center text-sm text-(--color-coral-400) font-medium mb-6">
          Your code has expired. Request a new one below.
        </p>
      ) : (
        <p className="text-center text-sm text-(--color-text-tertiary) mb-6">
          Code expires in{" "}
          <span
            className={`font-semibold ${
              seconds <= 60
                ? "text-(--color-coral-400)"
                : "text-(--color-text-secondary)"
            }`}
          >
            {formatTime(seconds)}
          </span>
        </p>
      )}

      {/* Verify button */}
      <button
        type="submit"
        disabled={!isFilled || isExpired || verifyOtpForm.formState.isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-(--color-brand-400) text-white font-medium text-sm py-3 rounded-lg mb-4 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        Verify account <ArrowRight size={16} />
      </button>

      {/* Resend */}
      <p className="text-center text-sm text-(--color-text-secondary) mb-4">
        Didn&apos;t receive a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={seconds > 0}
          className="font-medium text-(--color-brand-400) disabled:text-(--color-text-tertiary) disabled:cursor-not-allowed"
        >
          Resend
        </button>
      </p>

      {/* Back */}
      <div className="flex justify-center">
        <Link
          href="/signup"
          className="flex items-center gap-1.5 text-sm text-(--color-text-tertiary)"
        >
          <ArrowLeft size={14} /> Back to sign up
        </Link>
      </div>
    </form>
  );
}
