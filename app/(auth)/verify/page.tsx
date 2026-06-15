"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import AuthShell from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRound, Mail, RotateCcw } from "lucide-react"

type Step = "request" | "reset"

export default function Page() {
  const [step, setStep] = useState<Step>("request")

  const content = useMemo(() => {
    if (step === "request") {
      return {
        title: "Reset your password",
        subtitle:
          "Enter the email linked to your account and we’ll send you a 6-digit code to reset your password",
        icon: KeyRound,
      }
    }

    return {
      title: "Enter reset code",
      subtitle:
        "We sent a 6-digit code to your email. Enter it below and choose a new password.",
      icon: KeyRound,
    }
  }, [step])

  return (
    <AuthShell title={content.title} subtitle={content.subtitle} icon={KeyRound}>
      <div className="grid gap-4">
        {step === "request" ? (
          <>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-(--color-text-secondary)">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-tertiary)" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 border-(--color-border-tertiary) bg-(--color-background-secondary) pl-10 text-base text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
                />
              </div>
            </label>

            <Button
              className="h-11 rounded-xl bg-(--color-brand-400) text-base text-white hover:bg-(--color-brand-600)"
              onClick={() => setStep("reset")}
            >
              Send reset code
            </Button>

            <p className="text-center text-sm text-(--color-text-secondary)">
              <Link href="/login" className="font-medium text-(--color-brand-400) hover:text-(--color-brand-600)">
                Back to login
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-(--color-text-secondary)">6-digit code</span>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-tertiary)" />
                  <Input
                    inputMode="numeric"
                    placeholder="123456"
                    className="h-11 border-(--color-border-tertiary) bg-(--color-background-secondary) pl-10 text-base tracking-[0.4em] text-(--color-text-primary) placeholder:tracking-normal placeholder:text-(--color-text-tertiary)"
                  />
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-(--color-text-secondary)">New password</span>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  className="h-11 border-(--color-border-tertiary) bg-(--color-background-secondary) text-base text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-(--color-text-secondary)">Confirm password</span>
                <Input
                  type="password"
                  placeholder="Repeat your new password"
                  className="h-11 border-(--color-border-tertiary) bg-(--color-background-secondary) text-base text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
                />
              </label>
            </div>

            <Button className="h-11 rounded-xl bg-(--color-brand-400) text-base text-white hover:bg-(--color-brand-600)">
              Reset password
            </Button>

            <div className="flex flex-col items-center gap-3 text-sm text-(--color-text-secondary)">
              <button
                type="button"
                className="inline-flex items-center gap-2 font-medium text-(--color-brand-400) hover:text-(--color-brand-600)"
                onClick={() => setStep("request")}
              >
                <RotateCcw className="size-4" />
                Resend code
              </button>

              <button
                type="button"
                className="font-medium text-(--color-text-secondary) hover:text-(--color-text-primary)"
                onClick={() => setStep("request")}
              >
                Use a different email
              </button>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  )
}