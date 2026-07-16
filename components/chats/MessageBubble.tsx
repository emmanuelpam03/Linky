"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MessageItem } from "@/types";
import {
  deleteMessageForEveryone,
  deleteMessageForSelf,
} from "@/app/actions/messages/delete";
import { addReaction, removeReaction } from "@/app/actions/messages/reactions";
import { FileDown } from "lucide-react";
import FilePreviewModal from "./FilePreviewModal";
import { buildReactionSummary } from "@/lib/message-interactions";

type MessageBubbleProps = {
  message: MessageItem;
  showAvatar: boolean;
  conversationType?: "DIRECT" | "GROUP";
  onMessageUpdated: (messageId: string, updates: Partial<MessageItem>) => void;
  onReply?: (message: MessageItem) => void;
};

const MessageBubble = ({
  message,
  showAvatar,
  conversationType = "DIRECT",
  onMessageUpdated,
  onReply,
}: MessageBubbleProps) => {
  const {
    id,
    text,
    fileUrl,
    imageUrl,
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
  const [previewFile, setPreviewFile] = useState<{
    fileUrl: string;
    fileName: string;
    fileSize?: number;
  } | null>(null);
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

  const edited = (message as any).editedAt;

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionQuery, setReactionQuery] = useState("");
  const [recentReactions, setRecentReactions] = useState<string[]>(["❤️", "👍", "😂", "😮"]);
  const REACTION_OPTIONS = ["❤️", "😂", "😮", "😢", "👍", "👎", "🔥", "🎉", "🙏", "💯", "🤝", "😄"];
  const reactionSummary = buildReactionSummary(message.reactions, sender.id);
  const showReactionCounts = conversationType === "GROUP";
  const canReact = !isOwn;
  const reactionPickerRef = useRef<HTMLDivElement>(null);

  const handleToggleReaction = async (reaction: string) => {
    const existing = (message.reactions ?? []).find((r) => r.reaction === reaction);
    if (existing && existing.reactedByUser) {
      await removeReaction(id, reaction);
      onMessageUpdated(id, {
        reactions: (message.reactions ?? []).map((r) =>
          r.reaction === reaction ? { ...r, count: Math.max(0, r.count - 1), reactedByUser: false } : r,
        ),
      });
    } else {
      await addReaction(id, reaction);
      const updated = (message.reactions ?? []).slice();
      const found = updated.find((r) => r.reaction === reaction);
      if (found) {
        found.count += 1;
        found.reactedByUser = true;
      } else {
        updated.push({ reaction, count: 1, reactedByUser: true });
      }
      onMessageUpdated(id, { reactions: updated });
    }
    setRecentReactions((prev) => [reaction, ...prev.filter((item) => item !== reaction)].slice(0, 4));
    setReactionQuery("");
    setShowReactionPicker(false);
  };

  const handleToggleHeart = async () => {
    const heart = "❤️";
    const existing = (message.reactions ?? []).find((r) => r.reaction === heart);
    if (existing && existing.reactedByUser) {
      await removeReaction(id, heart);
      onMessageUpdated(id, {
        reactions: (message.reactions ?? []).map((r) =>
          r.reaction === heart ? { ...r, count: Math.max(0, r.count - 1), reactedByUser: false } : r,
        ),
      });
    } else {
      await addReaction(id, heart);
      const updated = (message.reactions ?? []).slice();
      const found = updated.find((r) => r.reaction === heart);
      if (found) {
        found.count += 1;
        found.reactedByUser = true;
      } else {
        updated.push({ reaction: heart, count: 1, reactedByUser: true });
      }
      onMessageUpdated(id, { reactions: updated });
    }
  };

  useEffect(() => {
    if (!showReactionPicker) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!reactionPickerRef.current?.contains(event.target as Node)) {
        setShowReactionPicker(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showReactionPicker]);

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
          <div className={cn("flex items-end gap-1.5", isOwn ? "flex-row-reverse" : "flex-row")}>
            {isDeletedForEveryone ? (
              <div className="rounded-2xl border border-(--color-border-tertiary) px-4 py-2 text-sm italic text-(--color-text-tertiary)">
                This message has been deleted
              </div>
            ) : (
              <>
                {message.replyTo && (
                  <div className="mb-1 rounded-lg border-l-2 border-(--color-border-secondary) bg-(--color-background-secondary) px-3 py-1 text-xs">
                    <div className="text-xs font-medium text-(--color-text-secondary)">{message.replyTo.sender.name}</div>
                    <div className="truncate">{message.replyTo.text ?? ""}</div>
                  </div>
                )}
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
                    {edited && (
                      <span className="ml-2 text-xs opacity-70">· edited</span>
                    )}
                  </div>
                )}
                {(imageUrl ?? fileUrl) && fileName && (
                  <button
                    onClick={() =>
                      setPreviewFile({
                        fileUrl: imageUrl ?? fileUrl ?? "",
                        fileName,
                        fileSize: fileSize ?? undefined,
                      })
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition-colors text-left",
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
                  </button>
                )}
              </>
            )}

            <div className="flex items-center gap-1.5">
              <span className="mx-1 text-[10px] text-(--color-text-tertiary)">
                {time}
              </span>

              {canReact && (
                <>
                  {reactionSummary.map((r) => (
                    <button
                      key={r.reaction}
                      onClick={() => handleToggleReaction(r.reaction)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm",
                        r.reactedByUser ? "bg-(--color-brand-50) font-semibold" : "bg-(--color-background-tertiary) opacity-90",
                      )}
                    >
                      <span>{r.reaction}</span>
                      {showReactionCounts && <span className="text-xs opacity-80">{r.count}</span>}
                    </button>
                  ))}

                  <div className="relative" ref={reactionPickerRef}>
                    <button
                      onClick={() => setShowReactionPicker((s) => !s)}
                      className="rounded-full px-2 py-0.5 text-sm opacity-90"
                    >
                      +
                    </button>
                    {showReactionPicker && (
                      <div className="absolute bottom-full mb-2 w-56 rounded-lg border border-(--color-border-tertiary) bg-(--color-background-primary) p-2 shadow-lg">
                        <input
                          value={reactionQuery}
                          onChange={(event) => setReactionQuery(event.target.value)}
                          placeholder="Search emoji"
                          className="mb-2 w-full rounded-md border border-(--color-border-tertiary) bg-(--color-background-secondary) px-2 py-1 text-xs outline-none"
                        />
                        <div className="mb-2 flex flex-wrap gap-1">
                          {recentReactions.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleToggleReaction(opt)}
                              className="rounded-md bg-(--color-background-secondary) px-2 py-1 text-base"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {REACTION_OPTIONS.filter((opt) =>
                            opt.toLowerCase().includes(reactionQuery.toLowerCase()),
                          ).map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleToggleReaction(opt)}
                              className="rounded-md bg-(--color-background-secondary) p-1 text-lg"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Context menu */}
        {contextMenu && (
          <div
            className="fixed z-50 min-w-40 overflow-hidden rounded-xl border border-(--color-border-tertiary) bg-(--color-background-primary) shadow-lg"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {/* Reply */}
            {!deletedForSelf && !isDeletedForEveryone && (
              <button
                onClick={() => {
                  setContextMenu(null);
                  if (typeof onReply === "function") onReply(message);
                }}
                className="flex w-full items-center px-4 py-2.5 text-sm text-(--color-text-primary) hover:bg-(--color-background-secondary) transition-colors"
              >
                Reply
              </button>
            )}

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

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        fileUrl={previewFile?.fileUrl || ""}
        fileName={previewFile?.fileName || ""}
        fileSize={previewFile?.fileSize}
        onClose={() => setPreviewFile(null)}
      />
    </>
  );
};

export default MessageBubble;
