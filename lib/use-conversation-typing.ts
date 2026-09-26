"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TypingUpdate } from "./websocket";

export function useConversationTyping(conversationId: string | undefined) {
  const [typingState, setTypingState] = useState({
    conversationId,
    users: {} as Record<string, string>,
  });
  const activeConversationIdRef = useRef(conversationId);
  const timersRef = useRef(new Map<string, number>());
  const typingUsers =
    typingState.conversationId === conversationId ? typingState.users : {};

  useLayoutEffect(() => {
    activeConversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
      setTypingState({ conversationId: undefined, users: {} });
    };
  }, [conversationId]);

  const handleTypingUpdate = useCallback(
    ({ userId, name, isTyping }: TypingUpdate) => {
      if (activeConversationIdRef.current !== conversationId) return;

      const timer = timersRef.current.get(userId);
      if (timer !== undefined) {
        window.clearTimeout(timer);
        timersRef.current.delete(userId);
      }

      if (!isTyping) {
        setTypingState((current) => {
          const users =
            current.conversationId === conversationId ? current.users : {};
          const next = { ...users };
          delete next[userId];
          return { conversationId, users: next };
        });
        return;
      }

      setTypingState((current) => ({
        conversationId,
        users: {
          ...(current.conversationId === conversationId ? current.users : {}),
          [userId]: name,
        },
      }));
      timersRef.current.set(
        userId,
        window.setTimeout(() => {
          timersRef.current.delete(userId);
          if (activeConversationIdRef.current !== conversationId) return;
          setTypingState((current) => {
            const users =
              current.conversationId === conversationId ? current.users : {};
            const next = { ...users };
            delete next[userId];
            return { conversationId, users: next };
          });
        }, 5000),
      );
    },
    [conversationId],
  );

  return { typingUsers, handleTypingUpdate };
}
