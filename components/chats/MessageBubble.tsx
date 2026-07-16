"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MessageItem } from "@/types";
import {
  deleteMessageForEveryone,
  deleteMessageForSelf,
} from "@/app/actions/messages/delete";
import { FileDown } from "lucide-react";

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
    fileUrl,
    fileName,
    fileSize,
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
  const menuWidth = 192;
  const menuItemHeight = 42;
  const menuMargin = 12;

  const initials = sender.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

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
    const optionCount =
      (!deletedForSelf && !deletedForEveryone ? 1 : 0) +
      (!deletedForEveryone && isOwn ? 1 : 0) +
      (deletedForEveryone ? 1 : 0);
    const menuHeight = Math.max(menuItemHeight, optionCount * menuItemHeight);
    const maxX = Math.max(menuMargin, window.innerWidth - menuWidth - menuMargin);
    const maxY = Math.max(menuMargin, window.innerHeight - menuHeight - menuMargin);

    setContextMenu({
      x: Math.min(Math.max(e.clientX, menuMargin), maxX),
      y: Math.min(Math.max(e.clientY, menuMargin), maxY),
    });
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
              {sender.image && <AvatarImage src={sender.image} alt={sender.name} />}
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
            <>
              {text && (
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
              )}
              {fileUrl && fileName && (
                <a
                  href={fileUrl}
                  download={fileName}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition-colors",
                    isOwn
                      ? "rounded-br-sm bg-(--color-brand-500) text-white hover:bg-(--color-brand-600)"
                      : "rounded-bl-sm bg-(--color-background-secondary) text-(--color-text-primary) hover:bg-(--color-background-tertiary)",
                    isDeleting && "opacity-50 pointer-events-none",
                  )}
                >
                  <FileDown className="size-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{fileName}</div>
                    {fileSize && (
                      <div className="text-xs opacity-75">
                        {formatFileSize(fileSize)}
                      </div>
                    )}
                  </div>
                </a>
              )}
            </>
          )}

          <span className="mx-1 text-[10px] text-(--color-text-tertiary)">
            {time}
          </span>
        </div>

        {/* Context menu */}
        {contextMenu && (
          <div
            className="fixed z-50 min-w-40 overflow-hidden rounded-xl border border-(--color-border-tertiary) bg-(--color-background-primary) shadow-lg"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {/* Delete for self — only show once, including deleted-for-everyone messages */}
            {!deletedForSelf && !isDeletedForEveryone && (
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
            {isDeletedForEveryone && !deletedForSelf && (
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
