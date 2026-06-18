"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import AuthShell from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRound, Mail, ShieldCheck, RotateCcw } from "lucide-react"

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
      title: "Set a new password",
      subtitle: "Enter the code sent to emmanuel@example.com",
      icon: ShieldCheck,
    }
  }, [step])

  return (
    <AuthShell title={content.title} subtitle={content.subtitle} icon={content.icon}>
      {step === "request" ? (
        <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); setStep("reset") }}>
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

          <Button type="submit" className="h-11 rounded-xl bg-(--color-brand-400) text-base text-white hover:bg-(--color-brand-600)">
            Send reset code
          </Button>

          <p className="text-center text-sm text-(--color-text-secondary)">
            <Link href="/login" className="font-medium text-(--color-brand-400) hover:text-(--color-brand-600)">
              Back to login
            </Link>
          </p>
        </form>
      ) : (
        <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-4">
            <div className="flex justify-center gap-1.5 sm:gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Input
                  key={index}
                  inputMode="numeric"
                  maxLength={1}
                  className="h-10 w-10 rounded-lg border-(--color-border-tertiary) bg-(--color-background-secondary) p-0 text-center text-lg font-semibold text-(--color-text-primary) placeholder:text-(--color-text-tertiary) sm:h-11 sm:w-11"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep("request")}
              className="mx-auto text-sm font-medium text-(--color-brand-400) hover:text-(--color-brand-600)"
            >
              Change email
            </button>

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
                placeholder="Re-enter password"
                className="h-11 border-(--color-border-tertiary) bg-(--color-background-secondary) text-base text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
              />
            </label>
          </div>

          <Button type="submit" className="h-11 rounded-xl bg-(--color-brand-400) text-base text-white hover:bg-(--color-brand-600)">
            Reset password
          </Button>

          <div className="flex items-center justify-center gap-1 text-sm text-(--color-text-secondary)">
            <span>Didn’t receive a code?</span>
            <button
              type="button"
              onClick={() => setStep("request")}
              className="inline-flex items-center gap-1 font-medium text-(--color-brand-400) hover:text-(--color-brand-600)"
            >
              <RotateCcw className="size-3.5" />
              Resend
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  )
}