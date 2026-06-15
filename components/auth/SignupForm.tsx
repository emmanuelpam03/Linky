"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Mail, UserRound } from "lucide-react"

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-(--color-text-secondary)">Full name</span>
        <Input
          type="text"
          placeholder="Emmanuel Padayachy"
          className="h-11 border-(--color-border-tertiary) bg-(--color-background-secondary) text-base text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-(--color-text-secondary)">Username</span>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-tertiary)" />
          <Input
            type="text"
            placeholder="emmanuel.dev"
            className="h-11 border-(--color-border-tertiary) bg-(--color-background-secondary) pl-10 text-base text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
          />
        </div>
      </label>

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

      <label className="grid gap-2">
        <span className="text-sm font-medium text-(--color-text-secondary)">Password</span>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            className="h-11 border-(--color-border-tertiary) bg-(--color-background-secondary) pr-10 text-base text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary) transition-colors hover:text-(--color-text-primary)"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </label>

      <Button className="h-11 rounded-xl bg-(--color-brand-400) text-base text-white hover:bg-(--color-brand-600)">
        Create account
      </Button>

      <p className="pt-1 text-center text-sm text-(--color-text-secondary)">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-(--color-brand-400) hover:text-(--color-brand-600)">
          Log in
        </Link>
      </p>
    </form>
  )
}