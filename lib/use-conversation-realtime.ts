"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MessageItem } from "../types";
import {
  connectToConversation,
  type MessageReactionSummary,
  type RealtimeStatus,
} from "./websocket";
import { useConversationTyping } from "./use-conversation-typing";
import { useConversationPresence } from "./use-conversation-presence";
import { useConversationReadReceipts } from "./use-conversation-read-receipts";

export function useConversationRealtime(
  conversationId: string | undefined,
  onMessage: (message: MessageItem) => void,
  onReactionsUpdate: (
    messageId: string,
    reactions: MessageReactionSummary[],
  ) => void,
) {
  const [status, setStatus] = useState<RealtimeStatus>("disconnected");
  const socketRef = useRef<ReturnType<typeof connectToConversation> | null>(
    null,
  );
  const activeConversationIdRef = useRef(conversationId);
  const onMessageRef = useRef(onMessage);
  const onReactionsUpdateRef = useRef(onReactionsUpdate);
  const { typingUsers, handleTypingUpdate } =
    useConversationTyping(conversationId);
  const { onlineUsers, handlePresenceEvent } =
    useConversationPresence(conversationId);
  const { lastReadAtByUser, handleReadReceiptEvent } =
    useConversationReadReceipts(conversationId);

  useLayoutEffect(() => {
    activeConversationIdRef.current = conversationId;
  }, [conversationId]);

  useLayoutEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useLayoutEffect(() => {
    onReactionsUpdateRef.current = onReactionsUpdate;
  }, [onReactionsUpdate]);

  useEffect(() => {
    if (!conversationId) return;

    const socket = connectToConversation(
      conversationId,
      (message) => {
        if (activeConversationIdRef.current === conversationId) {
          onMessageRef.current(message);
        }
      },
      setStatus,
      handleTypingUpdate,
      handlePresenceEvent,
      handleReadReceiptEvent,
      (messageId, reactions) => {
        if (activeConversationIdRef.current === conversationId) {
          onReactionsUpdateRef.current(messageId, reactions);
        }
      },
    );
    socketRef.current = socket;

    return () => {
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [
    conversationId,
    handleTypingUpdate,
    handlePresenceEvent,
    handleReadReceiptEvent,
  ]);

  const publishMessage = useCallback((messageId: string) => {
    socketRef.current?.publishMessage(messageId);
  }, []);

  const publishTyping = useCallback(
    (targetConversationId: string, isTyping: boolean) => {
      if (activeConversationIdRef.current !== targetConversationId) return;
      socketRef.current?.publishTyping(isTyping);
    },
    [],
  );

  const publishRead = useCallback((targetConversationId: string) => {
    if (activeConversationIdRef.current !== targetConversationId) return;
    socketRef.current?.publishRead();
  }, []);

  const publishReaction = useCallback((messageId: string) => {
    socketRef.current?.publishReaction(messageId);
  }, []);

  return {
    status,
    typingUsers,
    onlineUsers,
    lastReadAtByUser,
    publishMessage,
    publishTyping,
    publishRead,
    publishReaction,
  };
}
