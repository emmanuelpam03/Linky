"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { MessageCircleIcon } from "../ui/message-circle"
import { UsersIcon } from "../ui/users"
import { HeartIcon } from "../ui/heart"
import { UserRoundPlusIcon } from "../ui/user-round-plus"
import { SettingsIcon } from "../ui/settings"

const navItems = [
  { label: "Chats", href: "/chats", icon: MessageCircleIcon },
  { label: "Groups", href: "/groups", icon: UsersIcon },
  { label: "Friends", href: "/friends", icon: HeartIcon },
  { label: "Requests", href: "/requests", icon: UserRoundPlusIcon, badge: true },
]

export default function NavRail() {
  const pathname = usePathname()

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
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={itemClass(active)}>
              <Icon size={20} />
              {label}
              {badge && (
                <span className="absolute top-0 right-2.5 size-2 rounded-full bg-(--color-coral-400)" />
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
