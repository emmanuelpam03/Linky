"use client"

import { useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

type RequestItem = {
  id: string
  name: string
  initials: string
  mutualFriends: string
}

const incomingRequests: RequestItem[] = [
  { id: "sarah-appadoo", name: "Sarah Appadoo", initials: "SA", mutualFriends: "3 mutual friends" },
  { id: "tariq-bhugalo", name: "Tariq Bhugalo", initials: "TB", mutualFriends: "1 mutual friend" },
  { id: "amina-ramdass", name: "Amina Ramdass", initials: "AR", mutualFriends: "5 mutual friends" },
]

const sentRequests: RequestItem[] = [
  { id: "lina-naidoo", name: "Lina Naidoo", initials: "LN", mutualFriends: "Pending request" },
  { id: "priya-veerasamy", name: "Priya Veerasamy", initials: "PV", mutualFriends: "Sent yesterday" },
]

const tabs = [
  { id: "incoming", label: "Incoming", count: incomingRequests.length },
  { id: "sent", label: "Sent", count: sentRequests.length },
] as const

const RequestList = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("incoming")

  const requests = useMemo(
    () => (activeTab === "incoming" ? incomingRequests : sentRequests),
    [activeTab]
  )

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-(--color-background-primary)">
      <header className="border-b border-(--color-border-tertiary) px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-sm font-semibold text-(--color-text-primary)">
              Friend requests
            </h1>
            <p className="mt-1 text-xs text-(--color-text-secondary)">
              Review incoming requests or check what you have already sent
            </p>
          </div>

          <Badge
            variant="outline"
            className="border-(--color-border-tertiary) bg-(--color-background-secondary) text-(--color-text-secondary)"
          >
            {requests.length} visible
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-6 border-b border-(--color-border-tertiary)">
          {tabs.map((tab) => {
            const active = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative -mb-px flex items-center gap-2 border-b-2 px-0 pb-3 text-sm font-medium transition-colors",
                  active
                    ? "border-(--color-brand-400) text-(--color-brand-600)"
                    : "border-transparent text-(--color-text-secondary) hover:text-(--color-text-primary)"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    active
                      ? "bg-(--color-brand-400) text-white"
                      : "bg-(--color-background-tertiary) text-(--color-text-secondary)"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
        <div className="overflow-hidden rounded-xl border border-(--color-border-tertiary) bg-(--color-background-primary)">
          {requests.map((request, index) => (
            <div
              key={request.id}
              className={cn(
                "flex items-center justify-between gap-4 px-5 py-4 border-b border-(--color-border-tertiary)",
                index === requests.length - 1 && "border-b border-(--color-border-tertiary)"
              )}
            >
              <div className="flex items-center gap-4">
                <Avatar size="lg">
                  <AvatarFallback className="bg-(--color-brand-50) text-(--color-brand-900) text-sm font-medium">
                    {request.initials}
                  </AvatarFallback>
                  {activeTab === "incoming" && (
                    <AvatarBadge className="bg-(--color-brand-400) ring-(--color-background-primary)" />
                  )}
                </Avatar>

                <div>
                  <div className="text-sm font-semibold text-(--color-text-primary)">
                    {request.name}
                  </div>
                  <div className="text-xs text-(--color-text-secondary)">
                    {request.mutualFriends}
                  </div>
                </div>
              </div>

              {activeTab === "incoming" ? (
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    className="gap-2 rounded-md bg-(--color-brand-400) text-white hover:bg-(--color-brand-600)"
                  >
                    <Check className="size-4" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-9 rounded-md border-(--color-border-secondary) bg-(--color-background-primary) p-0 text-(--color-text-secondary) hover:bg-(--color-background-secondary)"
                    aria-label={`Decline ${request.name}`}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <Badge
                  variant="outline"
                  className="border-(--color-border-tertiary) bg-(--color-background-secondary) text-(--color-text-secondary)"
                >
                  Pending
                </Badge>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 py-6 text-center text-sm text-(--color-text-tertiary)">
            No more pending requests
        </div>
      </div>
    </div>
  )
}

export default RequestList