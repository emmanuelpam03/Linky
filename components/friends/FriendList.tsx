"use client"

import React, { useMemo, useState } from "react"
import FriendItem from "./FriendItem"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { mockConversations } from "@/lib/mock-conversations"

const FriendList = () => {
  const [query, setQuery] = useState("")

  const friends = useMemo(() => mockConversations.filter((c) => !c.isGroup), [])

  const filtered = useMemo(
    () =>
      friends.filter((f) =>
        f.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [friends, query]
  )

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-(--color-background-primary)">
      <header className="flex items-center justify-between gap-4 border-b border-(--color-border-tertiary) px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-(--color-text-primary)">
            Friends
          </h2>
          <p className="mt-1 text-xs text-(--color-text-secondary)">
            Manage your contacts and start a conversation
          </p>
        </div>

        <div className="flex w-full max-w-xl flex-wrap items-center justify-end gap-2">
          <Input
            placeholder="Search friends"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm rounded-md border-(--color-border-tertiary) bg-(--color-background-secondary) text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
          />
          <Button
            variant="default"
            size="sm"
            className="rounded-md bg-(--color-brand-400) text-white hover:bg-(--color-brand-600)"
          >
            <UserPlus className="size-4" />
            Add friend
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <div className="flex flex-col divide-y divide-(--color-border-tertiary) rounded-xl border border-(--color-border-tertiary) bg-(--color-background-primary)">
          {filtered.map((f) => (
            <FriendItem key={f.id} friend={f} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default FriendList