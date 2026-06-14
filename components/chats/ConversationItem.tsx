"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users } from "lucide-react";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

type ConversationItemProps = {
  conversation: Conversation;
};

export default function ConversationItem({ conversation }: ConversationItemProps) {
  const pathname = usePathname();
  const href = `/chats/${conversation.id}`;
  const active = pathname === href;

  const {
    name,
    initials,
    lastMessage,
    timestamp,
    isOnline,
    isTyping,
    unreadCount,
    isGroup,
  } = conversation;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-(--color-background-tertiary)",
        active && "bg-(--color-background-tertiary)"
      )}
    >
      <Avatar size="lg">
        <AvatarFallback
          className={cn(
            "text-sm font-medium",
            isOnline
              ? "bg-(--color-brand-50) text-(--color-brand-900)"
              : "bg-(--color-background-tertiary) text-(--color-text-secondary)"
          )}
        >
          {isGroup ? <Users size={18} /> : initials}
        </AvatarFallback>
        {isOnline && (
          <AvatarBadge className="bg-(--color-status-online) ring-(--color-background-primary)" />
        )}
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-(--color-text-primary)">
            {name}
          </span>
          <span className="shrink-0 text-xs text-(--color-text-tertiary)">
            {timestamp}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm text-(--color-text-secondary)",
              isTyping && "italic"
            )}
          >
            {lastMessage}
          </p>
          {unreadCount != null && unreadCount > 0 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-(--color-brand-400) text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
