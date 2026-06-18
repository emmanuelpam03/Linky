"use client"

import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"

type CreateGroupModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateGroupModal({ open, onOpenChange }: CreateGroupModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-(--color-border-tertiary) bg-(--color-background-primary) px-6 py-7 shadow-lg">
        <h2 className="text-xl font-semibold tracking-tight text-(--color-text-primary)">
          Create a group
        </h2>
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          Give your group a name and invite friends to start chatting together.
        </p>

        <form
          className="mt-6 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            onOpenChange(false)
          }}
        >
          <FormField label="Group name">
            <Input placeholder="Weekend plans" />
          </FormField>

          <FormField label="Description">
            <Input placeholder="Optional group description" />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg border-(--color-border-tertiary)"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="brand" size="form" className="min-w-28">
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
