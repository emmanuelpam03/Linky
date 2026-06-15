import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Zap } from "lucide-react"

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  icon?: LucideIcon
}

export default function AuthShell({ title, subtitle, children, icon: Icon = Zap }: AuthShellProps) {
  return (
    <div className="grid min-h-svh w-full place-items-center bg-(--color-background-secondary) px-4 py-6 text-(--color-text-primary)">
      <div className="w-full max-w-md rounded-2xl border border-(--color-border-tertiary) bg-(--color-background-primary) px-6 py-7 shadow-sm sm:px-7 sm:py-8">
          <div className="flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-(--color-brand-400) text-white shadow-sm">
              <Icon className="size-5" />
            </div>
          </div>

          <div className="mt-5 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-(--color-text-primary)">
              {title}
            </h1>
            <p className="mt-2 text-sm text-(--color-text-secondary)">{subtitle}</p>
          </div>

          <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}