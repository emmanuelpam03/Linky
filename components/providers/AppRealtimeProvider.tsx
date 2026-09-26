"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { parseConversationServerEvent } from "@/lib/websocket";

type FriendRequestStatus = "PENDING" | "ACCEPTED";
type PendingFriendUpdate = {
  requestId: string;
  status: FriendRequestStatus;
};

type AppRealtimeContextValue = {
  typingByConversation: Record<string, Record<string, string>>;
  friendRequestRevision: number;
  friendshipRevision: number;
  publishFriendRequestUpdate: (
    requestId: string,
    status: FriendRequestStatus,
  ) => void;
};

const AppRealtimeContext = createContext<AppRealtimeContextValue | null>(null);

export function AppRealtimeProvider({ children }: { children: ReactNode }) {
  const [typingByConversation, setTypingByConversation] = useState<
    Record<string, Record<string, string>>
  >({});
  const [friendRequestRevision, setFriendRequestRevision] = useState(0);
  const [friendshipRevision, setFriendshipRevision] = useState(0);
  const pendingFriendUpdatesRef = useRef(new Map<string, PendingFriendUpdate>());
  const flushPendingRef = useRef<() => void>(() => {});

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL;
    if (!url) {
      console.error("NEXT_PUBLIC_WS_URL is required for app real-time updates.");
      return;
    }
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "ws:" && parsedUrl.protocol !== "wss:") {
        throw new Error("URL must use ws:// or wss://.");
      }
    } catch (error) {
      console.error("Invalid NEXT_PUBLIC_WS_URL:", error);
      return;
    }

    let closed = false;
    let retryCount = 0;
    let reconnectTimer: number | null = null;
    let socket: WebSocket | null = null;
    const typingTimers = new Map<string, number>();
    const sentFriendUpdates = new Set<string>();

    const flushPending = () => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;

      for (const [key, update] of pendingFriendUpdatesRef.current) {
        if (sentFriendUpdates.has(key)) continue;
        socket.send(
          JSON.stringify({
            type: "friend.request.publish",
            requestId: update.requestId,
            status: update.status,
          }),
        );
        sentFriendUpdates.add(key);
      }
    };
    flushPendingRef.current = flushPending;

    const updateTyping = (
      conversationId: string,
      userId: string,
      name: string,
      isTyping: boolean,
    ) => {
      setTypingByConversation((current) => {
        const users = { ...(current[conversationId] ?? {}) };
        if (isTyping) users[userId] = name;
        else delete users[userId];

        const next = { ...current };
        if (Object.keys(users).length > 0) next[conversationId] = users;
        else delete next[conversationId];
        return next;
      });
    };

    const scheduleReconnect = () => {
      if (closed || reconnectTimer !== null) return;
      const delay = Math.min(500 * 2 ** retryCount, 15_000);
      retryCount = Math.min(retryCount + 1, 8);
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    };

    const connect = () => {
      if (closed) return;

      try {
        socket = new WebSocket(url);
      } catch (error) {
        console.error("Could not create the app WebSocket connection:", error);
        scheduleReconnect();
        return;
      }

      const currentSocket = socket;
      currentSocket.addEventListener("message", (event: MessageEvent) => {
        if (typeof event.data !== "string") {
          console.error("Received a non-text app WebSocket event.");
          return;
        }

        const serverEvent = parseConversationServerEvent(event.data);
        if (!serverEvent) {
          console.error("Received an invalid app WebSocket event.");
          return;
        }

        if (serverEvent.type === "ready") {
          retryCount = 0;
          flushPending();
          return;
        }

        if (serverEvent.type === "typing.updated") {
          const timerKey = `${serverEvent.conversationId}:${serverEvent.userId}`;
          const previousTimer = typingTimers.get(timerKey);
          if (previousTimer !== undefined) {
            window.clearTimeout(previousTimer);
            typingTimers.delete(timerKey);
          }

          updateTyping(
            serverEvent.conversationId,
            serverEvent.userId,
            serverEvent.name,
            serverEvent.isTyping,
          );
          if (serverEvent.isTyping) {
            typingTimers.set(
              timerKey,
              window.setTimeout(() => {
                typingTimers.delete(timerKey);
                if (!closed) {
                  updateTyping(
                    serverEvent.conversationId,
                    serverEvent.userId,
                    serverEvent.name,
                    false,
                  );
                }
              }, 5000),
            );
          }
          return;
        }

        if (serverEvent.type === "friend.request.updated") {
          setFriendRequestRevision((revision) => revision + 1);
          if (serverEvent.status === "ACCEPTED") {
            setFriendshipRevision((revision) => revision + 1);
          }
          return;
        }

        if (serverEvent.type === "friend.request.published") {
          const key = `${serverEvent.requestId}:${serverEvent.status}`;
          pendingFriendUpdatesRef.current.delete(key);
          sentFriendUpdates.delete(key);
          return;
        }

        if (serverEvent.type === "error") {
          if (serverEvent.requestId) {
            for (const [key, update] of pendingFriendUpdatesRef.current) {
              if (update.requestId === serverEvent.requestId) {
                pendingFriendUpdatesRef.current.delete(key);
                sentFriendUpdates.delete(key);
              }
            }
          }
          console.error("App WebSocket request rejected:", serverEvent.code);
        }
      });

      currentSocket.addEventListener("close", () => {
        if (socket === currentSocket) socket = null;
        sentFriendUpdates.clear();
        scheduleReconnect();
      });
      currentSocket.addEventListener("error", () => {
        console.error("App WebSocket connection error.");
      });
    };

    connect();

    return () => {
      closed = true;
      flushPendingRef.current = () => {};
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      for (const timer of typingTimers.values()) window.clearTimeout(timer);
      typingTimers.clear();
      sentFriendUpdates.clear();
      socket?.close(1000, "App closed");
      socket = null;
    };
  }, []);

  const publishFriendRequestUpdate = useCallback(
    (requestId: string, status: FriendRequestStatus) => {
      const key = `${requestId}:${status}`;
      pendingFriendUpdatesRef.current.set(key, { requestId, status });
      flushPendingRef.current();
    },
    [],
  );

  return (
    <AppRealtimeContext.Provider
      value={{
        typingByConversation,
        friendRequestRevision,
        friendshipRevision,
        publishFriendRequestUpdate,
      }}
    >
      {children}
    </AppRealtimeContext.Provider>
  );
}

export function useAppRealtime() {
  const context = useContext(AppRealtimeContext);
  if (!context) {
    throw new Error("useAppRealtime must be used within AppRealtimeProvider.");
  }
  return context;
}
