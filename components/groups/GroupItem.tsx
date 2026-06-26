"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { GroupListItem } from "@/types";

type GroupItemProps = {
  group: GroupListItem;
};

export default function GroupItem({ group }: GroupItemProps) {
  const pathname = usePathname();
  const href = `/groups/${group.id}`;
  const active = pathname === href;

  const initials = group.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const timestamp = group.lastMessageAt
    ? new Intl.DateTimeFormat("en", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(group.lastMessageAt))
    : null;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-(--color-background-tertiary)",
        active && "bg-(--color-background-tertiary)",
      )}
    >
      <Avatar size="lg">
        <AvatarFallback className="bg-(--color-background-tertiary) text-sm font-medium text-(--color-text-secondary)">
          {initials || <Users size={16} />}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-(--color-text-primary)">
            {group.name}
          </span>
          {timestamp && (
            <span className="shrink-0 text-xs text-(--color-text-tertiary)">
              {timestamp}
            </span>
          )}
        </div>
        <p className="truncate text-sm text-(--color-text-secondary)">
          {group.lastMessage ?? `${group.memberCount} members`}
        </p>
      </div>
    </Link>
  );
}
