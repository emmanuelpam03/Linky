"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Upload } from "lucide-react"

const ProfileForm = () => {
  return (
    <section className="rounded-xl border border-(--color-border-tertiary) bg-(--color-background-primary) px-5 py-5 shadow-sm">
      <h2 className="text-base font-semibold text-(--color-text-primary)">Profile</h2>
      <p className="mt-1 text-sm text-(--color-text-secondary)">
        Your public profile information visible to friends.
      </p>

      <div className="mt-5 flex items-start gap-5">
        <Avatar size="lg" className="shrink-0" style={{ width: 96, height: 96 }}>
          <AvatarFallback className="bg-(--color-brand-50) text-2xl font-semibold text-(--color-brand-900)">
            EN
          </AvatarFallback>
        </Avatar>

        <div className="pt-2">
          <Button variant="brand" size="sm" className="gap-2 rounded-lg">
            <Upload className="size-4" />
            Upload photo
          </Button>
          <p className="mt-2 text-sm text-(--color-text-secondary)">JPG or PNG, max 2MB</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <FormField label="Full name">
          <Input defaultValue="Emmanuel" />
        </FormField>

        <FormField label="Username">
          <Input defaultValue="emmanuel.dev" />
        </FormField>

        <FormField label="Bio">
          <Textarea
            defaultValue="Building things, one commit at a time"
            rows={3}
          />
        </FormField>

        <div className="flex justify-start pt-1">
          <Button variant="brand" size="form" className="min-w-44">
            Save changes
          </Button>
        </div>
      </div>
    </section>
  )
}

export default ProfileForm
