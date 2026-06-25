"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MessageItem } from "@/types";

type MessageBubbleProps = {
  message: MessageItem;
  showAvatar: boolean; // false when consecutive messages from same sender
};

const MessageBubble = ({ message, showAvatar }: MessageBubbleProps) => {
  const { text, isOwn, sender, createdAt } = message;

  const initials = sender.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const time = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(createdAt));

  return (
    <div className={cn("flex items-end gap-2", isOwn && "flex-row-reverse")}>
      {/* Avatar — shown for other user only */}
      <div className="size-7 shrink-0">
        {!isOwn && showAvatar ? (
          <Avatar size="sm">
            <AvatarFallback className="bg-(--color-brand-50) text-[10px] font-medium text-(--color-brand-900)">
              {initials}
            </AvatarFallback>
          </Avatar>
        ) : null}
      </div>

      <div
        className={cn("flex max-w-[70%] flex-col gap-1", isOwn && "items-end")}
      >
        {/* Sender name — shown for other user only when avatar is shown */}
        {!isOwn && showAvatar && (
          <span className="ml-1 text-xs text-(--color-text-secondary)">
            {sender.name}
          </span>
        )}

        {/* Text bubble */}
        {text && (
          <div
            className={cn(
              "rounded-2xl px-4 py-2 text-sm",
              isOwn
                ? "rounded-br-sm bg-(--color-brand-400) text-white"
                : "rounded-bl-sm bg-(--color-background-secondary) text-(--color-text-primary)",
            )}
          >
            {text}
          </div>
        )}

        {/* Timestamp */}
        <span className="mx-1 text-[10px] text-(--color-text-tertiary)">
          {time}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
