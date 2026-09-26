"use client";

import { useCallback, useEffect, useRef } from "react";

export function useTypingNotifications(
  conversationId: string,
  onTypingChange: (conversationId: string, isTyping: boolean) => void,
) {
  const isTypingRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);

  const stopTyping = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (heartbeatTimerRef.current !== null) {
      window.clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (!isTypingRef.current) return;

    isTypingRef.current = false;
    onTypingChange(conversationId, false);
  }, [conversationId, onTypingChange]);

  const updateTyping = useCallback(
    (text: string) => {
      if (!text) {
        stopTyping();
        return;
      }

      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingChange(conversationId, true);
        heartbeatTimerRef.current = window.setInterval(
          () => onTypingChange(conversationId, true),
          2000,
        );
      }

      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(stopTyping, 1500);
    },
    [conversationId, onTypingChange, stopTyping],
  );

  useEffect(() => () => stopTyping(), [stopTyping]);

  return { updateTyping, stopTyping };
}
