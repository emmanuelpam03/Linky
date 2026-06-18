"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { authLinkClass, FormField, IconInput, PasswordInput } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
import { Mail, UserRound } from "lucide-react"

export default function SignupForm() {
  return (
    <form className="grid gap-4">
      <FormField label="Full name">
        <Input type="text" placeholder="Emmanuel Padayachy" />
      </FormField>

      <FormField label="Username">
        <IconInput type="text" icon={UserRound} placeholder="emmanuel.dev" />
      </FormField>

      <FormField label="Email">
        <IconInput type="email" icon={Mail} placeholder="you@example.com" />
      </FormField>

      <FormField label="Password">
        <PasswordInput placeholder="At least 8 characters" />
      </FormField>

      <Link href={"/verify"}>
        <Button type="submit" variant="brand" size="form">
          Create account
        </Button>
      </Link>
      

      <p className="pt-1 text-center text-sm text-(--color-text-secondary)">
        Already have an account?{" "}
        <Link href="/login" className={authLinkClass}>
          Log in
        </Link>
      </p>
    </form>
  )
}
