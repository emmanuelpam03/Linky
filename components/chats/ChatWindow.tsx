"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, Users, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ConversationDetail, MessageItem } from "@/types";
import { getMessages } from "@/app/actions/messages/list";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";

type ChatWindowProps = {
  conversation?: ConversationDetail | null;
};

export default function ChatWindow({ conversation }: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversation) return;

    let cancelled = false;
    const conversationId = conversation.id;

    const load = async () => {
      setIsLoading(true);
      setMessages([]);
      setNextCursor(null);

      const result = await getMessages(conversationId);
      if (cancelled) return;

      if (result.success) {
        setMessages(result.data);
        setNextCursor(result.nextCursor);
      }
      setIsLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [conversation]);

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleLoadMore = useCallback(async () => {
    if (!conversation || !nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);

    // Save scroll position before prepending
    const container = scrollRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    const result = await getMessages(conversation.id, nextCursor);

    if (result.success) {
      setMessages((prev) => [...result.data, ...prev]);
      setNextCursor(result.nextCursor);

      // Restore scroll position after prepend
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    }

    setIsLoadingMore(false);
  }, [conversation, nextCursor, isLoadingMore]);

  // Detect scroll to top to load more
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (container.scrollTop === 0 && nextCursor && !isLoadingMore) {
      handleLoadMore();
    }
  }, [nextCursor, isLoadingMore, handleLoadMore]);

  const handleMessageSent = (message: MessageItem) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleMessageUpdated = (
    messageId: string,
    updates: Partial<MessageItem>,
  ) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
    );
  };

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
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4"
        >
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-(--color-text-tertiary)" />
            </div>
          ) : (
            <>
              {/* Load more indicator at top */}
              {isLoadingMore && (
                <div className="flex justify-center pb-4">
                  <Loader2 className="size-4 animate-spin text-(--color-text-tertiary)" />
                </div>
              )}

              {/* Load more button if there are older messages */}
              {nextCursor && !isLoadingMore && (
                <div className="flex justify-center pb-4">
                  <button
                    onClick={handleLoadMore}
                    className="text-xs text-(--color-brand-400) hover:underline"
                  >
                    Load older messages
                  </button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-(--color-text-tertiary)">
                    No messages yet. Say hello!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((message, index) => {
                    const prev = messages[index - 1];
                    const showAvatar =
                      !prev || prev.senderId !== message.senderId;
                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        showAvatar={showAvatar}
                        onMessageUpdated={handleMessageUpdated}
                      />
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </>
          )}
        </div>

        <MessageComposer
          conversationId={conversation.id}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
}
