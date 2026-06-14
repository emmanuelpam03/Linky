"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Users, Heart, UserPlus, Settings, Zap } from "lucide-react";

const navItems = [
  { label: "Chats", href: "/chats", icon: MessageCircle },
  { label: "Groups", href: "/groups", icon: Users },
  { label: "Friends", href: "/friends", icon: Heart },
  { label: "Requests", href: "/requests", icon: UserPlus, badge: true },
];

export default function NavRail() {
  const pathname = usePathname();

  const itemClass = (active: boolean) =>
    `relative flex flex-col items-center gap-1 px-3.5 py-1.5 rounded-md text-[10px] ${
      active
        ? "bg-[var(--color-brand-50)] text-[var(--color-brand-900)]"
        : "text-[var(--color-text-secondary)]"
    }`;

  return (
    <nav className="w-16 flex flex-col items-center py-3 gap-4 border-r border-(--color-border-tertiary) bg-(--color-background-secondary)">
      <div className="w-8 h-8 rounded-full bg-(--color-brand-400) flex items-center justify-center text-white">
        <Zap size={16} />
      </div>

      <div className="flex flex-col gap-4 mt-2 w-full items-center">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={itemClass(active)}>
              <Icon size={20} />
              {label}
              {badge && (
                <span className="absolute top-0 right-2.5 w-2 h-2 rounded-full bg-(--color-coral-400)" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex-1" />

      <Link href="/settings" className={itemClass(pathname.startsWith("/settings"))}>
        <Settings size={20} />
        Settings
      </Link>
    </nav>
  );
}