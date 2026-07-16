"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { MessageCircle, Users, Loader2, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConversationDetail, MessageItem } from "@/types";
import { getMessages } from "@/app/actions/messages/list";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import ChatSettingsPanel from "./ChatSettingsPanel";
import GroupSettingsPanel from "@/components/groups/GroupSettingsPanel";
import { getGroup } from "@/app/actions/groups/get";
import type { GroupDetail } from "@/types";
import ChatInfoModal from "./ChatInfoModal";
import GroupInfoModal from "@/components/groups/GroupInfoModal";
import { clearChat } from "@/app/actions/conversations/settings";
import { useToast } from "@/components/ui/toast";

type ChatWindowProps = {
  conversation?: ConversationDetail | null;
};

export default function ChatWindow({ conversation }: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageItem | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef(conversation?.id);
  const lastConversationId = useRef<string | undefined>(conversation?.id);
  const messagesRef = useRef<MessageItem[]>([]);
  const nextCursorRef = useRef<string | null>(null);
  const { toast } = useToast();

  useLayoutEffect(() => {
    conversationIdRef.current = conversation?.id;
    if (lastConversationId.current !== conversation?.id) {
      lastConversationId.current = conversation?.id;
      setGroupDetail(null);
      setShowSettings(false);
      setShowModal(false);
      setIsLoadingGroup(false);
    }
  }, [conversation?.id]);

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

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleLoadMore = useCallback(async () => {
    if (!conversation || !nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);

    const container = scrollRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    const result = await getMessages(conversation.id, nextCursor);

    if (result.success) {
      setMessages((prev) => [...result.data, ...prev]);
      setNextCursor(result.nextCursor);

      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    }

    setIsLoadingMore(false);
  }, [conversation, nextCursor, isLoadingMore]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (container.scrollTop === 0 && nextCursor && !isLoadingMore) {
      handleLoadMore();
    }
  }, [nextCursor, isLoadingMore, handleLoadMore]);

  const scrollToMessage = useCallback((messageId: string) => {
    const target = document.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("ring-2", "ring-(--color-brand-300)");
    window.setTimeout(() => target.classList.remove("ring-2", "ring-(--color-brand-300)"), 1800);
  }, []);

  const handleMessageSent = (message: MessageItem) => {
    setMessages((prev) => [...prev, message]);
    setReplyTo(null);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  const handleMessageUpdated = (
    messageId: string,
    updates: Partial<MessageItem>,
  ) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
    );
  };

  const handleClearChat = useCallback(async () => {
    if (!conversation) return false;

    const previousMessages = messagesRef.current;
    const previousCursor = nextCursorRef.current;

    setMessages([]);
    setNextCursor(null);

    try {
      const result = await clearChat(conversation.id);
      if (!result.success) {
        setMessages(previousMessages);
        setNextCursor(previousCursor);
        toast({
          title: "Could not clear chat",
          description: result.error ?? "Try again.",
          variant: "error",
        });
        return false;
      }

      toast({
        title: "Chat cleared",
        description: "Messages were removed from your view immediately.",
        variant: "success",
      });
      return true;
    } catch {
      setMessages(previousMessages);
      setNextCursor(previousCursor);
      toast({
        title: "Could not clear chat",
        description: "Try again.",
        variant: "error",
      });
      return false;
    }
  }, [conversation, toast]);

  const handleToggleSettings = async () => {
    if (!conversation) return;

    const currentConversation = conversation;
    const currentConvId = conversation.id;

    if (showSettings) {
      setShowSettings(false);
      return;
    }

    if (currentConversation.type === "GROUP" && !groupDetail) {
      setIsLoadingGroup(true);

      try {
        const result = await getGroup(currentConversation.id);

        if (currentConvId !== conversationIdRef.current) return;

        if (result.success && result.data) {
          setGroupDetail(result.data);
        }
      } catch {
        // Don't open settings if fetch failed
        if (currentConvId === conversationIdRef.current) {
          setIsLoadingGroup(false);
        }
        return; // ← bail out, don't call setShowSettings(true)
      } finally {
        if (currentConvId === conversationIdRef.current) {
          setIsLoadingGroup(false);
        }
      }
    }

    setShowSettings(true);
  };

  const handleShowModal = async () => {
    if (!conversation) return;

    if (conversation.type === "GROUP" && !groupDetail) {
      const currentConvId = conversation.id;
      setIsLoadingGroup(true);
      try {
        const result = await getGroup(currentConvId);
        if (currentConvId !== conversationIdRef.current) return;
        if (result.success && result.data) {
          setGroupDetail(result.data);
        } else {
          return;
        }
      } catch {
        return;
      } finally {
        if (currentConvId === conversationIdRef.current) {
          setIsLoadingGroup(false);
        }
      }
    }

    setShowModal(true);
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
    <div className="flex h-full overflow-hidden">
      <div className="flex h-full flex-1 flex-col bg-(--color-background-primary)">
        <header
          onClick={handleShowModal}
          className="flex items-center gap-3 border-b border-(--color-border-tertiary) px-6 py-4 cursor-pointer hover:bg-(--color-background-secondary) transition-colors"
        >
          <Avatar size="lg">
            {conversation.image && (
              <AvatarImage src={conversation.image} alt={conversation.name} />
            )}
            <AvatarFallback className="bg-(--color-brand-50) text-sm font-medium text-(--color-brand-900)">
              {conversation.type === "GROUP" ? <Users size={18} /> : initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-(--color-text-primary)">
              {conversation.name}
            </h2>
            <p className="text-xs text-(--color-text-tertiary)">
              {conversation.type === "DIRECT"
                ? `@${conversation.otherUser?.username}`
                : "Group"}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSettings();
            }}
            disabled={isLoadingGroup}
            className="rounded-lg p-1.5 text-(--color-text-tertiary) hover:bg-(--color-background-secondary) transition-colors"
          >
            {isLoadingGroup ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Info className="size-5" />
            )}
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
                        <div key={message.id} data-message-id={message.id}>
                          <MessageBubble
                            message={message}
                            showAvatar={showAvatar}
                            conversationType={conversation.type}
                            onMessageUpdated={handleMessageUpdated}
                            onReply={(m) => {
                              setReplyTo(m);
                              if (m.id) {
                                requestAnimationFrame(() => scrollToMessage(m.id));
                              }
                            }}
                          />
                        </div>
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
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </div>
      </div>

      {showSettings && conversation.type === "DIRECT" && (
        <ChatSettingsPanel
          conversation={conversation}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showSettings && conversation.type === "GROUP" && groupDetail && (
        <GroupSettingsPanel
          group={groupDetail}
          onClose={() => setShowSettings(false)}
          onGroupUpdated={(updates) =>
            setGroupDetail((prev) => (prev ? { ...prev, ...updates } : prev))
          }
        />
      )}

      {showModal && conversation.type === "DIRECT" && (
        <ChatInfoModal
          conversation={conversation}
          onClose={() => setShowModal(false)}
          onClearChat={handleClearChat}
        />
      )}

      {showModal && conversation.type === "GROUP" && groupDetail && (
        <GroupInfoModal
          group={groupDetail}
          onClose={() => setShowModal(false)}
          onGroupUpdated={(updates) =>
            setGroupDetail((prev) => (prev ? { ...prev, ...updates } : prev))
          }
          onClearChat={handleClearChat}
        />
      )}
    </div>
  );
}
