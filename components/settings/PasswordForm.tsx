import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LockKeyhole, Mail, UserRound } from "lucide-react"

const PasswordForm = () => {
  return (
    <section className="px-0 py-0">
      <h2 className="pt-6 text-base font-semibold text-(--color-text-primary)">Account</h2>

      <div className="mt-4 grid gap-4 pb-6 border-b border-(--color-border-tertiary)">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-(--color-text-secondary)">Email</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-tertiary)" />
            <Input
              defaultValue="emmanuel@example.com"
              className="h-12 border-(--color-border-tertiary) bg-(--color-background-secondary) pl-10 text-base text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
            />
          </div>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-(--color-text-secondary)">New password</span>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-tertiary)" />
              <Input
                type="password"
                placeholder="••••••••"
                className="h-12 border-(--color-border-tertiary) bg-(--color-background-secondary) pl-10 text-base text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
              />
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-(--color-text-secondary)">Confirm password</span>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-tertiary)" />
              <Input
                type="password"
                placeholder="••••••••"
                className="h-12 border-(--color-border-tertiary) bg-(--color-background-secondary) pl-10 text-base text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
              />
            </div>
          </label>
        </div>

        <div className="mt-2 flex justify-start">
          <Button className="h-11 min-w-44 rounded-xl bg-(--color-brand-400) px-6 text-base text-white hover:bg-(--color-brand-600)">
            Save changes
          </Button>
        </div>
      </div>
    </section>
  )
}

export default PasswordForm