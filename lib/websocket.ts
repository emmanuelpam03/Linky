import type { MessageItem } from "../types";

export type RealtimeStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export type TypingUpdate = {
  userId: string;
  name: string;
  isTyping: boolean;
};

export type ConversationServerEvent =
  | { type: "ready" }
  | { type: "subscribed"; conversationId: string }
  | { type: "unsubscribed"; conversationId: string }
  | { type: "message.published"; messageId: string }
  | {
      type: "message.created";
      conversationId: string;
      message: MessageItem;
    }
  | {
      type: "typing.updated";
      conversationId: string;
      userId: string;
      name: string;
      isTyping: boolean;
    }
  | { type: "error"; code: string; messageId?: string };

type SerializedMessage = Omit<MessageItem, "createdAt"> & {
  createdAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSerializedMessage(value: unknown): value is SerializedMessage {
  if (!isRecord(value) || !isRecord(value.sender)) return false;

  const sender = value.sender;
  return (
    typeof value.id === "string" &&
    typeof value.senderId === "string" &&
    typeof value.createdAt === "string" &&
    !Number.isNaN(Date.parse(value.createdAt)) &&
    typeof value.isOwn === "boolean" &&
    typeof value.deletedForEveryone === "boolean" &&
    typeof value.deletedForSelf === "boolean" &&
    typeof sender.id === "string" &&
    typeof sender.name === "string" &&
    typeof sender.username === "string" &&
    (typeof sender.image === "string" || sender.image === null)
  );
}

export function parseConversationServerEvent(
  serializedEvent: string,
): ConversationServerEvent | null {
  let value: unknown;
  try {
    value = JSON.parse(serializedEvent);
  } catch {
    return null;
  }

  if (!isRecord(value) || typeof value.type !== "string") return null;

  switch (value.type) {
    case "ready":
      return { type: "ready" };
    case "subscribed":
    case "unsubscribed":
      return typeof value.conversationId === "string"
        ? { type: value.type, conversationId: value.conversationId }
        : null;
    case "message.published":
      return typeof value.messageId === "string"
        ? { type: value.type, messageId: value.messageId }
        : null;
    case "message.created":
      if (
        typeof value.conversationId !== "string" ||
        !isSerializedMessage(value.message)
      ) {
        return null;
      }

      return {
        type: value.type,
        conversationId: value.conversationId,
        message: {
          ...value.message,
          createdAt: new Date(value.message.createdAt),
        },
      };
    case "typing.updated":
      return typeof value.conversationId === "string" &&
        typeof value.userId === "string" &&
        typeof value.name === "string" &&
        typeof value.isTyping === "boolean"
        ? {
            type: value.type,
            conversationId: value.conversationId,
            userId: value.userId,
            name: value.name,
            isTyping: value.isTyping,
          }
        : null;
    case "error":
      if (typeof value.code !== "string") return null;
      return {
        type: value.type,
        code: value.code,
        ...(typeof value.messageId === "string"
          ? { messageId: value.messageId }
          : {}),
      };
    default:
      return null;
  }
}

export function connectToConversation(
  conversationId: string,
  onMessage: (message: MessageItem) => void,
  onStatus: (status: RealtimeStatus) => void,
  onTyping: (update: TypingUpdate) => void,
) {
  const url = process.env.NEXT_PUBLIC_WS_URL;
  if (!url) {
    console.error("NEXT_PUBLIC_WS_URL is required for real-time chat.");
    onStatus("disconnected");
    return {
      publishMessage: () => {},
      publishTyping: () => {},
      close: () => {},
    };
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "ws:" && parsedUrl.protocol !== "wss:") {
      throw new Error("URL must use ws:// or wss://.");
    }
  } catch (error) {
    console.error("Invalid NEXT_PUBLIC_WS_URL:", error);
    onStatus("disconnected");
    return {
      publishMessage: () => {},
      publishTyping: () => {},
      close: () => {},
    };
  }

  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let retryCount = 0;
  let subscribed = false;
  let closed = false;
  const pendingMessageIds = new Set<string>();
  const sentMessageIds = new Set<string>();

  const flushPendingMessages = () => {
    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      !subscribed
    ) {
      return;
    }

    for (const messageId of pendingMessageIds) {
      if (sentMessageIds.has(messageId)) continue;
      socket.send(JSON.stringify({ type: "message.publish", messageId }));
      sentMessageIds.add(messageId);
    }
  };

  const scheduleReconnect = () => {
    if (closed || reconnectTimer !== null) return;
    if (retryCount >= 8) {
      onStatus("disconnected");
      console.error("WebSocket reconnect limit reached.");
      return;
    }

    const delay = Math.min(500 * 2 ** retryCount, 15_000);
    retryCount += 1;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  };

  const connect = () => {
    if (closed) return;
    onStatus(retryCount === 0 ? "connecting" : "reconnecting");

    try {
      socket = new WebSocket(url);
    } catch (error) {
      console.error("Could not create the WebSocket connection:", error);
      scheduleReconnect();
      return;
    }

    const currentSocket = socket;
    currentSocket.addEventListener("open", () => {
      currentSocket.send(JSON.stringify({ type: "subscribe", conversationId }));
    });

    currentSocket.addEventListener("message", (event: MessageEvent) => {
      if (typeof event.data !== "string") {
        console.error("Received a non-text WebSocket event.");
        return;
      }

      const serverEvent = parseConversationServerEvent(event.data);
      if (!serverEvent) {
        console.error("Received an invalid WebSocket event.");
        return;
      }

      if (
        serverEvent.type === "subscribed" &&
        serverEvent.conversationId === conversationId
      ) {
        subscribed = true;
        retryCount = 0;
        onStatus("connected");
        flushPendingMessages();
        return;
      }

      if (
        serverEvent.type === "message.created" &&
        serverEvent.conversationId === conversationId
      ) {
        onMessage(serverEvent.message);
        return;
      }

      if (
        serverEvent.type === "typing.updated" &&
        serverEvent.conversationId === conversationId
      ) {
        onTyping({
          userId: serverEvent.userId,
          name: serverEvent.name,
          isTyping: serverEvent.isTyping,
        });
        return;
      }

      if (serverEvent.type === "message.published") {
        pendingMessageIds.delete(serverEvent.messageId);
        sentMessageIds.delete(serverEvent.messageId);
        return;
      }

      if (serverEvent.type === "error") {
        if (serverEvent.messageId) {
          pendingMessageIds.delete(serverEvent.messageId);
          sentMessageIds.delete(serverEvent.messageId);
        }
        console.error("WebSocket request rejected:", serverEvent.code);
      }
    });

    currentSocket.addEventListener("error", () => {
      onStatus("reconnecting");
    });

    currentSocket.addEventListener("close", () => {
      if (socket === currentSocket) socket = null;
      subscribed = false;
      sentMessageIds.clear();
      if (closed) return;
      onStatus("reconnecting");
      scheduleReconnect();
    });
  };

  connect();

  return {
    publishMessage(messageId: string) {
      pendingMessageIds.add(messageId);
      flushPendingMessages();
    },
    publishTyping(isTyping: boolean) {
      if (
        !socket ||
        socket.readyState !== WebSocket.OPEN ||
        !subscribed
      ) {
        return;
      }

      socket.send(
        JSON.stringify({ type: "typing.update", conversationId, isTyping }),
      );
    },
    close() {
      closed = true;
      subscribed = false;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      socket?.close(1000, "Conversation closed");
      socket = null;
      onStatus("disconnected");
    },
  };
}
