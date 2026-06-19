"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { authLinkClass, FormField, IconInput, PasswordInput } from "@/components/ui/form-field"
import { Loader2, LockKeyhole, Mail } from "lucide-react"
import { loginSchema, LoginSchema } from "@/lib/schemas/auth.schema"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const router = useRouter()

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginSchema) => {
    try {
      // TODO: call login API with `data`
      console.log(data)
      router.push("/")
    } catch (error) {
      console.error("Failed to login:", error)
      // Optionally display error to user
    }
    
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormField label="Email">
        <IconInput type="email" icon={Mail} placeholder="you@example.com" {...form.register("email")} />
      </FormField>
      {form.formState.errors.email && (
        <p className="text-sm text-(--color-coral-400)">{form.formState.errors.email.message}</p>
      )}

      <FormField label="Password">
        <PasswordInput icon={LockKeyhole} placeholder="Enter your password" {...form.register("password")} />
      </FormField>
      {form.formState.errors.password && (
        <p className="text-sm text-(--color-coral-400)">{form.formState.errors.password.message}</p>
      )}

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

      <Button type="submit" variant="brand" size="form" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <span>Log in</span>}
      </Button>

      <p className="pt-1 text-center text-sm text-(--color-text-secondary)">
            Don&apos;t have an account? <Link href="/signup" className={authLinkClass}>Sign up</Link>
      </p>
    </form>
  )
}
