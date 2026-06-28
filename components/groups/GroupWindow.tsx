"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Users, Loader2, Info } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { GroupDetail, MessageItem } from "@/types";
import { getMessages } from "@/app/actions/messages/list";
import MessageBubble from "@/components/chats/MessageBubble";
import MessageComposer from "@/components/chats/MessageComposer";
import GroupSettingsPanel from "./GroupSettingsPanel";
import GroupInfoModal from "./GroupInfoModal";

type GroupWindowProps = {
  group?: GroupDetail | null;
};

export default function GroupWindow({ group }: GroupWindowProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [groupData, setGroupData] = useState<GroupDetail | null>(group ?? null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reset groupData when group prop changes (render-time pattern avoids cascading renders)
  const prevGroupIdRef = useRef(group?.id);
  if (group?.id !== prevGroupIdRef.current) {
    prevGroupIdRef.current = group?.id;
    setGroupData(group ?? null);
    setShowModal(false);
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const isAppendRef = useRef(false);
  const prevLengthRef = useRef(0);

  const handleGroupUpdated = (updates: Partial<GroupDetail>) => {
    setGroupData((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  useEffect(() => {
    if (!group) return;

    let cancelled = false;
    const conversationId = group.id;

    const load = async () => {
      setIsLoading(true);
      setMessages([]);
      setNextCursor(null);

      try {
        const result = await getMessages(conversationId);
        if (cancelled) return;

        if (result.success) {
          isAppendRef.current = true;
          setMessages(result.data);
          setNextCursor(result.nextCursor);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [group]);

  useEffect(() => {
    if (isAppendRef.current) {
      isAppendRef.current = false;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  const handleLoadMore = useCallback(async () => {
    if (!group || !nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    const container = scrollRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    try {
      const result = await getMessages(group.id, nextCursor);

      if (result.success) {
        setMessages((prev) => [...result.data, ...prev]);
        setNextCursor(result.nextCursor);
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        });
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [group, nextCursor, isLoadingMore]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (container.scrollTop === 0 && nextCursor && !isLoadingMore) {
      handleLoadMore();
    }
  }, [nextCursor, isLoadingMore, handleLoadMore]);

  const handleMessageSent = (message: MessageItem) => {
    isAppendRef.current = true;
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

  if (!group) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-(--color-background-primary)">
        <div className="flex size-20 items-center justify-center rounded-full bg-(--color-brand-50)">
          <Users
            size={36}
            className="text-(--color-brand-400)"
            strokeWidth={1.5}
          />
        </div>
        <h2 className="mt-5 text-base font-semibold text-(--color-text-primary)">
          No group selected
        </h2>
        <p className="mt-1 max-w-xs text-center text-sm text-(--color-text-secondary)">
          Pick a group to view the conversation, or create a new one
        </p>
      </div>
    );
  }

  const initials = (groupData?.name ?? group.name)
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex h-full flex-1 flex-col bg-(--color-background-primary)">
        <header
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 border-b border-(--color-border-tertiary) px-6 py-4 cursor-pointer hover:bg-(--color-background-secondary) transition-colors"
        >
          <Avatar size="lg">
            <AvatarFallback className="bg-(--color-background-tertiary) text-sm font-medium text-(--color-text-secondary)">
              {initials || <Users size={16} />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-(--color-text-primary)">
              {groupData?.name ?? group.name}
            </h2>
            <p className="text-xs text-(--color-text-tertiary)">
              {groupData?.memberCount ?? group.memberCount} members
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings((s) => !s);
            }}
            className="rounded-lg p-1.5 text-(--color-text-tertiary) hover:bg-(--color-background-secondary) transition-colors"
          >
            <Info className="size-5" />
          </button>
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
                {isLoadingMore && (
                  <div className="flex justify-center pb-4">
                    <Loader2 className="size-4 animate-spin text-(--color-text-tertiary)" />
                  </div>
                )}
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
                      No messages yet. Start the conversation!
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
            conversationId={group.id}
            onMessageSent={handleMessageSent}
          />
        </div>
      </div>

      {showSettings && groupData && (
        <GroupSettingsPanel
          group={groupData}
          onClose={() => setShowSettings(false)}
          onGroupUpdated={handleGroupUpdated}
        />
      )}

      {showModal && groupData && (
        <GroupInfoModal
          group={groupData}
          onClose={() => setShowModal(false)}
          onGroupUpdated={handleGroupUpdated}
        />
      )}
    </div>
  );
}
