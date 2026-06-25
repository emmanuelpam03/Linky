"use client";

import { MessageCircle, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import MessageComposer from "./MessageComposer";
import { ConversationDetail } from "@/types";

type ChatWindowProps = {
  conversation?: ConversationDetail | null;
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

  const initials = conversation.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full flex-col bg-(--color-background-primary)">
      <header className="flex items-center gap-3 border-b border-(--color-border-tertiary) px-6 py-4">
        <Avatar size="lg">
          <AvatarFallback className="bg-(--color-brand-50) text-sm font-medium text-(--color-brand-900)">
            {conversation.type === "GROUP" ? <Users size={18} /> : initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-sm font-semibold text-(--color-text-primary)">
            {conversation.name}
          </h2>
          <p className="text-xs text-(--color-text-tertiary)">
            {conversation.type === "DIRECT"
              ? `@${conversation.otherUser?.username}`
              : "Group"}
          </p>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-(--color-text-tertiary)">
              No messages yet. Say hello!
            </p>
          </div>
        </div>

        <MessageComposer conversationId={conversation.id} />
      </div>
    </div>
  );
}
