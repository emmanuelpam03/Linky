"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TypingUpdate } from "./websocket";

export function useConversationTyping(conversationId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const activeConversationIdRef = useRef(conversationId);
  const timersRef = useRef(new Map<string, number>());

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
      setTypingUsers({});
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
        setTypingUsers((current) => {
          const next = { ...current };
          delete next[userId];
          return next;
        });
        return;
      }

      setTypingUsers((current) => ({ ...current, [userId]: name }));
      timersRef.current.set(
        userId,
        window.setTimeout(() => {
          timersRef.current.delete(userId);
          if (activeConversationIdRef.current !== conversationId) return;
          setTypingUsers((current) => {
            const next = { ...current };
            delete next[userId];
            return next;
          });
        }, 5000),
      );
    },
    [conversationId],
  );

  return { typingUsers, handleTypingUpdate };
}
