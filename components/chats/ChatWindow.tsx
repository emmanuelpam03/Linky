"use client";

import { MessageCircle, Users } from "lucide-react";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

type ChatWindowProps = {
  conversation?: Conversation | null;
};

export default function ChatWindow({ conversation }: ChatWindowProps) {
  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-(--color-background-primary)">
        <div className="flex size-20 items-center justify-center rounded-full bg-(--color-brand-50)">
          <MessageCircle
            size={36}
            className="text-(--color-brand-400)"
            strokeWidth={1.5}
          />
        </div>
        <h2 className="mt-5 text-base font-semibold text-(--color-text-primary)">
          No conversation selected
        </h2>
        <p className="mt-1 text-sm text-(--color-text-secondary)">
          Choose a chat from the list to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-(--color-background-primary)">
      <header className="flex items-center gap-3 border-b border-(--color-border-tertiary) px-6 py-4">
        <Avatar size="lg">
          <AvatarFallback
            className={cn(
              "text-sm font-medium",
              conversation.isOnline
                ? "bg-(--color-brand-50) text-(--color-brand-900)"
                : "bg-(--color-background-tertiary) text-(--color-text-secondary)"
            )}
          >
            {conversation.isGroup ? (
              <Users size={18} />
            ) : (
              conversation.initials || conversation.name.slice(0, 2).toUpperCase()
            )}
          </AvatarFallback>
          {conversation.isOnline && (
            <AvatarBadge className="bg-(--color-status-online) ring-(--color-background-primary)" />
          )}
        </Avatar>
        <div>
          <h2 className="text-sm font-semibold text-(--color-text-primary)">
            {conversation.name}
          </h2>
          {conversation.isOnline && (
            <p className="text-xs text-(--color-status-online)">Online</p>
          )}
          {conversation.isTyping && (
            <p className="text-xs italic text-(--color-text-secondary)">Typing...</p>
          )}
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-(--color-text-tertiary)">
          Messages will appear here
        </p>
      </div>
    </div>
  );
}
