"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MessageItem } from "@/types";
import {
  deleteMessageForEveryone,
  deleteMessageForSelf,
} from "@/app/actions/messages/delete";

type MessageBubbleProps = {
  message: MessageItem;
  showAvatar: boolean;
  onMessageUpdated: (messageId: string, updates: Partial<MessageItem>) => void;
};

const MessageBubble = ({
  message,
  showAvatar,
  onMessageUpdated,
}: MessageBubbleProps) => {
  const {
    id,
    text,
    isOwn,
    sender,
    createdAt,
    deletedForEveryone,
    deletedForSelf,
  } = message;
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleContextMenu = (e: React.MouseEvent) => {
    // Don't show context menu if already deleted for self with no everyone deletion
    if (deletedForSelf && !deletedForEveryone) return;
    // Don't show if deleted for everyone and already deleted for self
    if (deletedForEveryone && deletedForSelf) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDeleteForSelf = async () => {
    setContextMenu(null);
    setIsDeleting(true);
    const result = await deleteMessageForSelf(id);
    if (result.success) {
      onMessageUpdated(id, { deletedForSelf: true });
    }
    setIsDeleting(false);
  };

  const handleDeleteForEveryone = async () => {
    setContextMenu(null);
    setIsDeleting(true);
    const result = await deleteMessageForEveryone(id);
    if (result.success) {
      onMessageUpdated(id, { deletedForEveryone: true });
    }
    setIsDeleting(false);
  };

  // Fully hidden — deleted for self (and already deleted for everyone if applicable)
  if (deletedForSelf) return null;

  const isDeletedForEveryone = deletedForEveryone;

  return (
    <>
      {/* Context menu backdrop */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenu(null)}
        />
      )}

      <div
        className={cn(
          "flex items-end gap-2",
          isOwn ? "flex-row-reverse" : "flex-row",
        )}
        onContextMenu={handleContextMenu}
      >
        {/* Avatar */}
        <div className="size-7 shrink-0">
          {showAvatar ? (
            <Avatar size="sm">
              <AvatarFallback
                className={cn(
                  "text-[10px] font-medium",
                  isOwn
                    ? "bg-(--color-brand-400) text-white"
                    : "bg-(--color-brand-50) text-(--color-brand-900)",
                )}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          ) : null}
        </div>

        <div
          className={cn(
            "flex max-w-[70%] flex-col gap-1",
            isOwn ? "items-end" : "items-start",
          )}
        >
          {!isOwn && showAvatar && (
            <span className="ml-1 text-xs text-(--color-text-secondary)">
              {sender.name}
            </span>
          )}

          {/* Bubble */}
          {isDeletedForEveryone ? (
            <div className="rounded-2xl border border-(--color-border-tertiary) px-4 py-2 text-sm italic text-(--color-text-tertiary)">
              This message has been deleted
            </div>
          ) : (
            text && (
              <div
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm",
                  isOwn
                    ? "rounded-br-sm bg-(--color-brand-400) text-white"
                    : "rounded-bl-sm bg-(--color-background-secondary) text-(--color-text-primary)",
                  isDeleting && "opacity-50",
                )}
              >
                {text}
              </div>
            )
          )}

          <span className="mx-1 text-[10px] text-(--color-text-tertiary)">
            {time}
          </span>
        </div>

        {/* Context menu */}
        {contextMenu && (
          <div
            className="fixed z-50 min-w-[160px] overflow-hidden rounded-xl border border-(--color-border-tertiary) bg-(--color-background-primary) shadow-lg"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {/* Delete for self — available to everyone as long as not already deleted for self */}
            {!isDeletedForEveryone && (
              <button
                onClick={handleDeleteForSelf}
                className="flex w-full items-center px-4 py-2.5 text-sm text-(--color-text-primary) hover:bg-(--color-background-secondary) transition-colors"
              >
                Delete for me
              </button>
            )}

            {/* Delete for everyone — only sender, only if not already deleted for everyone */}
            {isOwn && !isDeletedForEveryone && (
              <button
                onClick={handleDeleteForEveryone}
                className="flex w-full items-center px-4 py-2.5 text-sm text-(--color-coral-600) hover:bg-(--color-coral-50) transition-colors"
              >
                Delete for everyone
              </button>
            )}

            {/* If deleted for everyone, receiver can still delete for themselves */}
            {isDeletedForEveryone && !isOwn && (
              <button
                onClick={handleDeleteForSelf}
                className="flex w-full items-center px-4 py-2.5 text-sm text-(--color-text-primary) hover:bg-(--color-background-secondary) transition-colors"
              >
                Delete for me
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default MessageBubble;
