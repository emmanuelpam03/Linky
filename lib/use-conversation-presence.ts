"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { PresenceEvent } from "./websocket";

export function useConversationPresence(conversationId: string | undefined) {
  const [presence, setPresence] = useState({
    conversationId,
    users: {} as Record<string, string>,
  });
  const activeConversationIdRef = useRef(conversationId);
  const onlineUsers =
    presence.conversationId === conversationId ? presence.users : {};

  useLayoutEffect(() => {
    activeConversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    return () => {
      setPresence({ conversationId: undefined, users: {} });
    };
  }, [conversationId]);

  const handlePresenceEvent = useCallback(
    (event: PresenceEvent) => {
      if (activeConversationIdRef.current !== conversationId) return;

      if (event.type === "presence.snapshot") {
        const users = Object.fromEntries(
          event.users.map((user) => [user.userId, user.name]),
        );
        setPresence({ conversationId, users });
        return;
      }

      setPresence((current) => {
        const users =
          current.conversationId === conversationId ? current.users : {};
        const next = { ...users };
        if (event.isOnline) {
          next[event.userId] = event.name;
        } else {
          delete next[event.userId];
        }
        return { conversationId, users: next };
      });
    },
    [conversationId],
  );

  return { onlineUsers, handlePresenceEvent };
}
