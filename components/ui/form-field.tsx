"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export const authLinkClass =
  "font-medium text-(--color-brand-400) transition-colors hover:text-(--color-brand-600)"

type FormFieldProps = {
  label: string
  children: React.ReactNode
  className?: string
}

export function FormField({ label, children, className }: FormFieldProps) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-sm font-medium text-(--color-text-secondary)">{label}</span>
      {children}
    </label>
  )
}

type IconInputProps = React.ComponentProps<typeof Input> & {
  icon: LucideIcon
}

export function IconInput({ icon: Icon, className, ...props }: IconInputProps) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-tertiary)" />
      <Input className={cn("pl-10", className)} {...props} />
    </div>
  )
}

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  icon?: LucideIcon
}

export function PasswordInput({ icon: Icon, className, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-tertiary)" />
      )}
      <Input
        type={showPassword ? "text" : "password"}
        className={cn(Icon && "pl-10", "pr-10", className)}
        {...props}
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
  )
}
