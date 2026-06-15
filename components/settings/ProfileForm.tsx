import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload } from "lucide-react"

const ProfileForm = () => {
  return (
    <section className="px-0 py-0">
      <div className="flex items-start gap-5">
        <Avatar
          size="lg"
          className="shrink-0"
          style={{ width: 96, height: 96 }}
        >
          <AvatarFallback className="bg-(--color-brand-50) text-2xl font-semibold text-(--color-brand-900)">
            EN
          </AvatarFallback>
        </Avatar>

        <div className="pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              className="gap-2 rounded-md bg-(--color-brand-400) text-white hover:bg-(--color-brand-600)"
            >
              <Upload className="size-4" />
              Upload photo
            </Button>
          </div>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            JPG or PNG, max 2MB
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 pb-6 border-b border-(--color-border-tertiary)">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-(--color-text-secondary)">Full name</span>
          <Input
            defaultValue="Emmanuel"
            className="h-12 border-(--color-border-tertiary) bg-(--color-background-secondary) text-base text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-(--color-text-secondary)">Username</span>
          <Input
            defaultValue="emmanuel.dev"
            className="h-12 border-(--color-border-tertiary) bg-(--color-background-secondary) text-base text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-(--color-text-secondary)">Bio</span>
          <textarea
            defaultValue="Building things, one commit at a time"
            rows={3}
            className="min-h-14 w-full rounded-md border border-(--color-border-tertiary) bg-(--color-background-secondary) px-4 py-3 text-base text-(--color-text-primary) outline-none transition-[color,box-shadow] placeholder:text-(--color-text-tertiary) focus:border-ring focus:ring-3 focus:ring-ring/50"
          />
        </label>
      </div>
    </section>
  )
}

export default ProfileForm