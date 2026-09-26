"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { MessageCircleIcon } from "../ui/message-circle"
import { UsersIcon } from "../ui/users"
import { HeartIcon } from "../ui/heart"
import { UserRoundPlusIcon } from "../ui/user-round-plus"
import { SettingsIcon } from "../ui/settings"
import { getPendingRequestCount } from "@/app/actions/friends/list"
import { getUnreadNotificationCount } from "@/app/actions/notifications/list"
import { useAppRealtime } from "@/components/providers/AppRealtimeProvider"

const navItems = [
  { label: "Chats", href: "/chats", icon: MessageCircleIcon },
  { label: "Groups", href: "/groups", icon: UsersIcon },
  { label: "Friends", href: "/friends", icon: HeartIcon },
  { label: "Requests", href: "/requests", icon: UserRoundPlusIcon, badge: true },
  { label: "Alerts", href: "/notifications", icon: Bell, notificationBadge: true },
]

export default function NavRail() {
  const pathname = usePathname()
  const [pendingRequestCount, setPendingRequestCount] = useState(0)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const { friendRequestRevision, notificationRevision } = useAppRealtime()

  useEffect(() => {
    let active = true
    getPendingRequestCount()
      .then((count) => {
        if (active) setPendingRequestCount(count)
      })
      .catch((error: unknown) => {
        console.error("Could not load the pending friend request count:", error)
      })

    return () => {
      active = false
    }
  }, [friendRequestRevision])

  useEffect(() => {
    let active = true
    getUnreadNotificationCount()
      .then((count) => {
        if (active) setUnreadNotificationCount(count)
      })
      .catch((error: unknown) => {
        console.error("Could not load the unread notification count:", error)
      })

    return () => {
      active = false
    }
  }, [notificationRevision])

  const itemClass = (active: boolean) =>
    cn(
      "relative flex flex-col items-center gap-1 rounded-lg px-3.5 py-1.5 text-[10px] font-medium transition-colors",
      active
        ? "bg-(--color-brand-50) text-(--color-brand-900)"
        : "text-(--color-text-secondary) hover:text-(--color-text-primary)"
    )

  return (
    <nav className="flex w-16 flex-col items-center gap-4 border-r border-(--color-border-tertiary) bg-(--color-background-secondary) py-3">
      <div className="flex size-8 items-center justify-center rounded-full bg-(--color-brand-400) text-white shadow-sm">
        <Zap size={16} />
      </div>

      <div className="mt-2 flex w-full flex-col items-center gap-4">
        {navItems.map(({ label, href, icon: Icon, badge, notificationBadge }) => {
          const active = pathname.startsWith(href)
          const count = badge
            ? pendingRequestCount
            : notificationBadge
              ? unreadNotificationCount
              : 0
          return (
            <Link key={href} href={href} className={itemClass(active)}>
              <Icon size={20} />
              {label}
              {count > 0 && (
                <span className="absolute top-0 right-2 min-w-4 rounded-full bg-(--color-coral-400) px-1 text-center text-[9px] leading-4 text-white">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div className="flex-1" />

      <Link href="/settings" className={itemClass(pathname.startsWith("/settings"))}>
        <SettingsIcon size={20} />
        Settings
      </Link>
    </nav>
  )
}
