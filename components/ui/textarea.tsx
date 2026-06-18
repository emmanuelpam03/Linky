import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-20 w-full rounded-lg border border-(--color-border-tertiary) bg-(--color-background-secondary) px-3.5 py-3 text-base text-(--color-text-primary) shadow-xs transition-[color,box-shadow] outline-none placeholder:text-(--color-text-tertiary) focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
