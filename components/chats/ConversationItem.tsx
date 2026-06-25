"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ConversationListItem } from "@/types";

type ConversationItemProps = {
  conversation: ConversationListItem;
};

export default function ConversationItem({
  conversation,
}: ConversationItemProps) {
  const pathname = usePathname();
  const href = `/chats/${conversation.id}`;
  const active = pathname === href;

  const initials = conversation.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const timestamp = conversation.lastMessageAt
    ? new Intl.DateTimeFormat("en", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(conversation.lastMessageAt))
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
        <AvatarFallback
          className={cn(
            "text-sm font-medium",
            conversation.type === "DIRECT"
              ? "bg-(--color-brand-50) text-(--color-brand-900)"
              : "bg-(--color-background-tertiary) text-(--color-text-secondary)",
          )}
        >
          {conversation.type === "GROUP" ? <Users size={18} /> : initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-(--color-text-primary)">
            {conversation.name}
          </span>
          {timestamp && (
            <span className="shrink-0 text-xs text-(--color-text-tertiary)">
              {timestamp}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm text-(--color-text-secondary)">
            {conversation.lastMessage ?? "No messages yet"}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-(--color-brand-400) text-[10px] font-medium text-white">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
