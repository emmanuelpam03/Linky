"use client"

import { Button } from "@/components/ui/button"
import { FormField, IconInput, PasswordInput } from "@/components/ui/form-field"
import { LockKeyhole, Mail } from "lucide-react"

const PasswordForm = () => {
  return (
    <section className="mt-6 rounded-xl border border-(--color-border-tertiary) bg-(--color-background-primary) px-5 py-5 shadow-sm">
      <h2 className="text-base font-semibold text-(--color-text-primary)">Account</h2>
      <p className="mt-1 text-sm text-(--color-text-secondary)">
        Update your email and password credentials.
      </p>

      <div className="mt-5 grid gap-4">
        <FormField label="Email">
          <IconInput icon={Mail} defaultValue="emmanuel@example.com" />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="New password">
            <PasswordInput icon={LockKeyhole} placeholder="••••••••" />
          </FormField>

          <FormField label="Confirm password">
            <PasswordInput icon={LockKeyhole} placeholder="••••••••" />
          </FormField>
        </div>

        <div className="flex justify-start pt-1">
          <Button variant="brand" size="form" className="min-w-44">
            Save changes
          </Button>
        </div>
      </div>
    </section>
  )
}

export default PasswordForm
