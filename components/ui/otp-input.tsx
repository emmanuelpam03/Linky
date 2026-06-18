"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

type OtpInputProps = {
  length?: number
  className?: string
}

export function OtpInput({ length = 6, className }: OtpInputProps) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([])

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return

    const input = inputsRef.current[index]
    if (input) input.value = value

    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !event.currentTarget.value && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  return (
    <div className={cn("flex justify-center gap-1.5 sm:gap-2", className)}>
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element
          }}
          inputMode="numeric"
          maxLength={1}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className="h-10 w-10 rounded-lg p-0 text-center text-lg font-semibold sm:h-11 sm:w-11"
        />
      ))}
    </div>
  )
}
