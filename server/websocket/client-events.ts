import type { RawData } from "ws";
import { WebSocket } from "ws";
import { z } from "zod";
import {
  getClientState,
  removeSubscription,
  sendJson,
  subscribeToConversation,
} from "./connection-state";
import { publishMessage } from "./message-events";
import { publishTyping } from "./typing-events";

const clientEventSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("subscribe"),
      conversationId: z.string().min(1).max(128),
    })
    .strict(),
  z
    .object({
      type: z.literal("unsubscribe"),
      conversationId: z.string().min(1).max(128),
    })
    .strict(),
  z
    .object({
      type: z.literal("message.publish"),
      messageId: z.string().min(1).max(128),
    })
    .strict(),
  z
    .object({
      type: z.literal("typing.update"),
      conversationId: z.string().min(1).max(128),
      isTyping: z.boolean(),
    })
    .strict(),
]);

function decodeMessage(data: RawData) {
  if (Array.isArray(data)) return Buffer.concat(data).toString("utf8");
  if (Buffer.isBuffer(data)) return data.toString("utf8");
  return Buffer.from(data).toString("utf8");
}

export async function handleClientMessage(
  socket: WebSocket,
  data: RawData,
  isBinary: boolean,
) {
  if (isBinary) {
    socket.close(1003, "Only text events are supported");
    return;
  }

  let value: unknown;
  try {
    value = JSON.parse(decodeMessage(data));
  } catch {
    sendJson(socket, { type: "error", code: "invalid_json" });
    return;
  }

  const parsed = clientEventSchema.safeParse(value);
  if (!parsed.success) {
    sendJson(socket, { type: "error", code: "invalid_event" });
    return;
  }

  const state = getClientState(socket);
  if (!state) {
    socket.close(1008, "Authentication required");
    return;
  }

  switch (parsed.data.type) {
    case "subscribe":
      await subscribeToConversation(socket, state, parsed.data.conversationId);
      break;
    case "unsubscribe":
      removeSubscription(socket, parsed.data.conversationId);
      sendJson(socket, {
        type: "unsubscribed",
        conversationId: parsed.data.conversationId,
      });
      break;
    case "message.publish":
      await publishMessage(socket, state, parsed.data.messageId);
      break;
    case "typing.update":
      await publishTyping(
        socket,
        state,
        parsed.data.conversationId,
        parsed.data.isTyping,
      );
      break;
  }
}
