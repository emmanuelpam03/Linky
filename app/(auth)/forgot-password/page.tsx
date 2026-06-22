"use client";

import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import {
  authLinkClass,
  FormField,
  IconInput,
  PasswordInput,
} from "@/components/ui/form-field";
import { OtpInput } from "@/components/ui/otp-input";
import {
  KeyRound,
  Mail,
  ShieldCheck,
  RotateCcw,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ForgotPasswordSchema,
  forgotPasswordSchema,
  ResetPasswordSchema,
  resetPasswordSchema,
  VerifyOtpSchema,
  verifyOtpSchema,
} from "@/lib/schemas/auth.schema";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Step = "request" | "verify" | "reset";

export default function Page() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const router = useRouter();

  const forgotPasswordForm = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onForgotPasswordSubmit = async (data: ForgotPasswordSchema) => {
    const result = await authClient.emailOtp.requestPasswordReset({
      email: data.email,
    });

    if (result.error) {
      forgotPasswordForm.setError("root.serverError", {
        message:
          result.error.message ?? "Something went wrong. Please try again.",
      });
      return;
    }

    setEmail(data.email);
    setStep("verify");
  };

  const verifyOtpForm = useForm<VerifyOtpSchema>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { otp: "" },
  });

  const onVerifyOtpSubmit = async (data: VerifyOtpSchema) => {
    const result = await authClient.emailOtp.checkVerificationOtp({
      email,
      otp: data.otp,
      type: "forget-password",
    });

    if (result.error) {
      verifyOtpForm.setError("otp", {
        message: result.error.message ?? "Invalid or expired code.",
      });
      return;
    }

    setStep("reset");
  };

  const resetPasswordForm = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onResetPasswordSubmit = async (data: ResetPasswordSchema) => {
    const result = await authClient.emailOtp.resetPassword({
      email,
      otp: verifyOtpForm.getValues("otp"),
      password: data.newPassword,
    });

    if (result.error) {
      resetPasswordForm.setError("root.serverError", {
        message:
          result.error.message ?? "Something went wrong. Please try again.",
      });
      return;
    }

    router.push("/login");
  };

  const onResendCode = async () => {
    const result = await authClient.emailOtp.requestPasswordReset({ email });

    if (result.error) {
      verifyOtpForm.setError("root.serverError", {
        message: result.error.message ?? "Failed to resend code.",
      });
      return;
    }

    verifyOtpForm.reset({ otp: "" });
  };

  const onBackToLogin = () => {
    router.push("/login");
  };

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
            subtitle: "Create a strong password for your account",
            icon: ShieldCheck,
          };

  return (
    <AuthShell
      title={content.title}
      subtitle={content.subtitle}
      icon={content.icon}
    >
      {step === "request" && (
        <form
          className="grid gap-4"
          onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}
        >
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

          <Button
            type="submit"
            variant="brand"
            size="form"
            disabled={forgotPasswordForm.formState.isSubmitting}
          >
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
        <form
          className="grid gap-4"
          onSubmit={verifyOtpForm.handleSubmit(onVerifyOtpSubmit)}
        >
          <OtpInput
            value={verifyOtpForm.watch("otp")}
            onChange={(val) =>
              verifyOtpForm.setValue("otp", val, { shouldValidate: true })
            }
          />
          {verifyOtpForm.formState.errors.otp && (
            <p className="text-sm text-(--color-coral-400) text-center">
              {verifyOtpForm.formState.errors.otp.message}
            </p>
          )}

          {verifyOtpForm.formState.errors.root?.serverError && (
            <p className="text-sm text-(--color-coral-400) text-center">
              {verifyOtpForm.formState.errors.root.serverError.message}
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

          <Button
            type="submit"
            variant="brand"
            size="form"
            disabled={verifyOtpForm.formState.isSubmitting}
          >
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
        <form
          className="grid gap-4"
          onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)}
        >
          <FormField label="New password">
            <PasswordInput
              placeholder="At least 8 characters"
              {...resetPasswordForm.register("newPassword")}
            />
          </FormField>
          {resetPasswordForm.formState.errors.newPassword && (
            <p className="text-sm text-(--color-coral-400)">
              {resetPasswordForm.formState.errors.newPassword.message}
            </p>
          )}

          <FormField label="Confirm password">
            <PasswordInput
              placeholder="Re-enter password"
              {...resetPasswordForm.register("confirmPassword")}
            />
          </FormField>
          {resetPasswordForm.formState.errors.confirmPassword && (
            <p className="text-sm text-(--color-coral-400)">
              {resetPasswordForm.formState.errors.confirmPassword.message}
            </p>
          )}

          {resetPasswordForm.formState.errors.root?.serverError && (
            <p className="text-sm text-(--color-coral-400)">
              {resetPasswordForm.formState.errors.root.serverError.message}
            </p>
          )}

          <Button
            type="submit"
            variant="brand"
            size="form"
            disabled={resetPasswordForm.formState.isSubmitting}
          >
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
  );
}
