"use client"

import { useState } from "react"
import AuthShell from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { authLinkClass, FormField, IconInput, PasswordInput } from "@/components/ui/form-field"
import { OtpInput } from "@/components/ui/otp-input"
import { KeyRound, Mail, ShieldCheck, RotateCcw, Loader2, ArrowLeft } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ForgotPasswordSchema,
  forgotPasswordSchema,
  ResetPasswordSchema,
  resetPasswordSchema,
  VerifyOtpSchema,
  verifyOtpSchema,
} from "@/lib/schemas/auth.schema"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

type Step = "request" | "verify" | "reset"

export default function Page() {
  const [step, setStep] = useState<Step>("request")
  const [email, setEmail] = useState("")
  const router = useRouter()

  const forgotPasswordForm = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const onForgotPasswordSubmit = async (data: ForgotPasswordSchema) => {
    try {
      // TODO: call forgot password API with `data`
      console.log(data)
      setEmail(data.email)
      setStep("verify")
    } catch (error) {
      console.error("Failed to send reset code:", error)
      // Optionally display error to user
    }
  }

  const verifyOtpForm = useForm<VerifyOtpSchema>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { otp: "" },
  })

  const onVerifyOtpSubmit = async (data: VerifyOtpSchema) => {
    try {
      // TODO: call verify OTP API with `data`
      console.log(data)
      setStep("reset")
    } catch (error) {
      console.error("Failed to verify OTP:", error)
      // Optionally display error to user
    }
  }

  const resetPasswordForm = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  const onResetPasswordSubmit = async (data: ResetPasswordSchema) => {
    try {
      // TODO: call reset password API with `data`
      console.log(data)
      router.push("/login")
    } catch (error) {
      console.error("Failed to reset password:", error)
      // Optionally display error to user
    }

  }

  const onResendCode = async () => {
    try {
      // TODO: call resend code API
      console.log("Resend code")
    } catch (error) {
      console.error("Failed to resend code:", error)
      // Optionally display error to user
    }
  }

  const onBackToLogin = () => {
    router.push("/login")
  }

  const content =
    step === "request"
      ? {
          title: "Reset your password",
          subtitle:
            "Enter the email linked to your account and we'll send you a 6-digit code to reset your password",
          icon: KeyRound,
        }
      : step === "verify"
      ? {
          title: "Enter verification code",
          subtitle: `Enter the code sent to ${email}`,
          icon: ShieldCheck,
        }
      : {
          title: "Set a new password",
          subtitle: email ? `Enter the code sent to ${email}` : "Enter the verification code sent to your email",
          icon: ShieldCheck,
        }

  return (
    <AuthShell title={content.title} subtitle={content.subtitle} icon={content.icon}>
      {step === "request" && (
        <form className="grid gap-4" onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
          <FormField label="Email">
            <IconInput
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              {...forgotPasswordForm.register("email")}
            />
          </FormField>
          {forgotPasswordForm.formState.errors.email && (
            <p className="text-sm text-(--color-coral-400)">
              {forgotPasswordForm.formState.errors.email.message}
            </p>
          )}

          <Button type="submit" variant="brand" size="form" disabled={forgotPasswordForm.formState.isSubmitting}>
            {forgotPasswordForm.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span>Send reset code</span>
            )}
          </Button>

          <p className="pt-1 text-center text-sm text-(--color-text-secondary)">
            <button
              type="button"
              onClick={onBackToLogin}
              className={`inline-flex items-center gap-1 ${authLinkClass}`}
            >
              <ArrowLeft className="size-3.5" /> Back to login
            </button>
          </p>
        </form>
      )}

      {step === "verify" && (
        <form className="grid gap-4" onSubmit={verifyOtpForm.handleSubmit(onVerifyOtpSubmit)}>
          <OtpInput
            value={verifyOtpForm.watch("otp")}
            onChange={(val) => verifyOtpForm.setValue("otp", val, { shouldValidate: true })}
          />
          {verifyOtpForm.formState.errors.otp && (
            <p className="text-sm text-(--color-coral-400) text-center">
              {verifyOtpForm.formState.errors.otp.message}
            </p>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep("request")}
              className={`text-sm ${authLinkClass}`}
            >
              Change email
            </button>
          </div>

          <Button type="submit" variant="brand" size="form" disabled={verifyOtpForm.formState.isSubmitting}>
            {verifyOtpForm.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span>Verify code</span>
            )}
          </Button>

          <p className="pt-1 text-center text-sm text-(--color-text-secondary)">
            Didn&apos;t receive a code?{" "}
            <button
              type="button"
              onClick={onResendCode}
              className={`inline-flex items-center gap-1 ${authLinkClass}`}
            >
              Resend <RotateCcw className="size-3.5" />
            </button>
          </p>
        </form>
      )}

      {step === "reset" && (
        <form className="grid gap-4" onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)}>
          <FormField label="New password">
            <PasswordInput placeholder="At least 8 characters" {...resetPasswordForm.register("newPassword")} />
          </FormField>
          {resetPasswordForm.formState.errors.newPassword && (
            <p className="text-sm text-(--color-coral-400)">
              {resetPasswordForm.formState.errors.newPassword.message}
            </p>
          )}

          <FormField label="Confirm password">
            <PasswordInput placeholder="Re-enter password" {...resetPasswordForm.register("confirmPassword")} />
          </FormField>
          {resetPasswordForm.formState.errors.confirmPassword && (
            <p className="text-sm text-(--color-coral-400)">
              {resetPasswordForm.formState.errors.confirmPassword.message}
            </p>
          )}

          <Button type="submit" variant="brand" size="form" disabled={resetPasswordForm.formState.isSubmitting}>
            {resetPasswordForm.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span>Reset password</span>
            )}
          </Button>

          <p className="pt-1 text-center text-sm text-(--color-text-secondary)">
            <button
              type="button"
              onClick={onBackToLogin}
              className={`inline-flex items-center gap-1 ${authLinkClass}`}
            >
              <ArrowLeft className="size-3.5" /> Back to login
            </button>
          </p>
        </form>
      )}
    </AuthShell>
  )
}