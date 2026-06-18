"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { authLinkClass, FormField, IconInput, PasswordInput } from "@/components/ui/form-field"
import { LockKeyhole, Mail } from "lucide-react"

export default function LoginForm() {
  return (
    <form className="grid gap-4">
      <FormField label="Email">
        <IconInput type="email" icon={Mail} placeholder="you@example.com" />
      </FormField>

      <FormField label="Password">
        <PasswordInput icon={LockKeyhole} placeholder="Enter your password" />
      </FormField>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-sm text-(--color-text-secondary)">
          <input
            type="checkbox"
            className="size-4 rounded border-(--color-border-secondary) text-(--color-brand-400) focus:ring-ring/50"
          />
          Remember me
        </label>

        <Link href="/forgot-password" className={authLinkClass}>
          Forgot password?
        </Link>
      </div>

      <Button type="submit" variant="brand" size="form">
        Log in
      </Button>

      <p className="pt-1 text-center text-sm text-(--color-text-secondary)">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className={authLinkClass}>
          Sign up
        </Link>
      </p>
    </form>
  )
}
