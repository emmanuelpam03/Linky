"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import AuthShell from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { authLinkClass, FormField, IconInput, PasswordInput } from "@/components/ui/form-field"
import { OtpInput } from "@/components/ui/otp-input"
import { KeyRound, Mail, ShieldCheck, RotateCcw } from "lucide-react"

type Step = "request" | "reset"

export default function Page() {
  const [step, setStep] = useState<Step>("request")
  const [email, setEmail] = useState("emmanuel@example.com")
  const [otp, setOtp] = useState("")

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
      subtitle: `Enter the code sent to ${email}`,
      icon: ShieldCheck,
    }
  }, [step, email])

  return (
    <AuthShell title={content.title} subtitle={content.subtitle} icon={content.icon}>
      {step === "request" ? (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)
            const emailValue = formData.get("email") as string
            setEmail(emailValue)
            setStep("reset")
          }}
        >
          <FormField label="Email">
            <IconInput type="email" icon={Mail} placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </FormField>

          <Button type="submit" variant="brand" size="form">
            Send reset code
          </Button>

          <p className="text-center text-sm text-(--color-text-secondary)">
            <Link href="/login" className={authLinkClass}>
              Back to login
            </Link>
          </p>
        </form>
      ) : (
        <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-4">
            <OtpInput value={otp} onChange={setOtp} />

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("request")}
                className={`text-sm ${authLinkClass}`}
              >
                Change email
              </button>
            </div>

            <FormField label="New password">
              <PasswordInput placeholder="At least 8 characters" />
            </FormField>

            <FormField label="Confirm password">
              <PasswordInput placeholder="Re-enter password" />
            </FormField>
          </div>

          <Button type="submit" variant="brand" size="form">
            Reset password
          </Button>

          <div className="flex items-center justify-center gap-1 text-sm text-(--color-text-secondary)">
            <span>Didn’t receive a code?</span>
            <button
              type="button"
              onClick={() => setStep("request")}
              className={`inline-flex items-center gap-1 ${authLinkClass}`}
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
