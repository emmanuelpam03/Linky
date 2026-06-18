"use client"

import React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import type { Conversation } from "@/types"
import { cn } from "@/lib/utils"

type FriendItemProps = {
  friend: Conversation
}

const FriendItem = ({ friend }: FriendItemProps) => {
  const { id, name, initials, isOnline, timestamp } = friend

  const fallbackInitials =
    initials || name.split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("")

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-(--color-background-secondary)">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar size="lg">
            <AvatarFallback
              className={cn(
                "text-sm font-medium",
                isOnline
                  ? "bg-(--color-brand-50) text-(--color-brand-900)"
                  : "bg-(--color-background-tertiary) text-(--color-text-secondary)"
              )}
            >
              {fallbackInitials}
            </AvatarFallback>
            <AvatarBadge
              className={cn(
                isOnline
                  ? "bg-(--color-status-online)"
                  : "bg-(--color-status-offline)",
                "size-2.5 ring-2 ring-(--color-background-primary)"
              )}
            />
          </Avatar>
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight text-(--color-text-primary)">
            {name}
          </div>
          <div className="mt-0.5 truncate text-xs text-(--color-text-secondary)">
            {isOnline ? "Online" : `Last seen ${timestamp ?? "--"}`}
          </div>
        </div>
      </div>

      <Link
        href={`/chats/${id}`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-2 rounded-lg border-(--color-border-tertiary) bg-(--color-background-primary) text-(--color-text-primary) hover:bg-(--color-background-secondary)"
        )}
      >
        <MessageSquare className="size-4" />
        Message
      </Link>
    </div>
  )
}

export default FriendItem