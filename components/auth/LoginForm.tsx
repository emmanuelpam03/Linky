"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Mail, LockKeyhole } from "lucide-react"

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form className="grid gap-4">
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
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-tertiary)" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="h-11 border-(--color-border-tertiary) bg-(--color-background-secondary) pl-10 pr-10 text-base text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
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

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-sm text-(--color-text-secondary)">
          <input
            type="checkbox"
            className="size-4 rounded border-(--color-border-secondary) text-(--color-brand-400) focus:ring-ring/50"
          />
          Remember me
        </label>

        <Link href="/forgot-password" className="text-sm font-medium text-(--color-brand-400) hover:text-(--color-brand-600)">
          Forgot password?
        </Link>
      </div>

      <Button className="h-11 rounded-xl bg-(--color-brand-400) text-base text-white hover:bg-(--color-brand-600)">
        Log in
      </Button>
    </form>
  )
}