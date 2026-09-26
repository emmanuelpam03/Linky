import type { RawData } from "ws";
import { WebSocket } from "ws";
import { z } from "zod";
import {
  getClientState,
  sendJson,
} from "./connection-state";
import { publishMessageReactions } from "./reaction-events";
import { publishMessage } from "./message-events";
import { publishFriendRequestUpdate } from "./friend-events";
import {
  joinConversationCall,
  leaveConversationCall,
  publishCallStatus,
  relayCallSignal,
  startConversationCall,
} from "./call-events";
import {
  subscribeToConversation,
  unsubscribeFromConversation,
} from "./presence-events";
import { publishConversationRead } from "./read-events";
import { publishTyping } from "./typing-events";
import { subscribeToUserPresence } from "./user-presence-events";

const clientEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("call.status"),
    conversationId: z.string().min(1).max(128),
  }).strict(),
  z.object({
    type: z.literal("call.start"),
    conversationId: z.string().min(1).max(128),
    mediaType: z.enum(["audio", "video"]),
  }).strict(),
  z.object({
    type: z.literal("call.join"),
    conversationId: z.string().min(1).max(128),
  }).strict(),
  z.object({
    type: z.literal("call.leave"),
    conversationId: z.string().min(1).max(128),
  }).strict(),
  z.object({
    type: z.literal("call.signal"),
    conversationId: z.string().min(1).max(128),
    peerUserId: z.string().min(1).max(128),
    signal: z.discriminatedUnion("kind", [
      z.object({
        kind: z.literal("description"),
        descriptionType: z.enum(["offer", "answer"]),
        sdp: z.string().min(1).max(12_000),
      }).strict(),
      z.object({
        kind: z.literal("candidate"),
        candidate: z.string().max(2_048),
        sdpMid: z.string().nullable(),
        sdpMLineIndex: z.number().int().nullable(),
      }).strict(),
    ]),
  }).strict(),
  z.object({ type: z.literal("user.subscribe") }).strict(),
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
      type: z.literal("message.reactions.publish"),
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
  z
    .object({
      type: z.literal("conversation.read"),
      conversationId: z.string().min(1).max(128),
    })
    .strict(),
  z
    .object({
      type: z.literal("friend.request.publish"),
      requestId: z.string().min(1).max(128),
      status: z.enum(["PENDING", "ACCEPTED"]),
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
    case "call.status":
      await publishCallStatus(socket, state, parsed.data.conversationId);
      break;
    case "call.start":
      await startConversationCall(
        socket,
        state,
        parsed.data.conversationId,
        parsed.data.mediaType,
      );
      break;
    case "call.join":
      await joinConversationCall(socket, state, parsed.data.conversationId);
      break;
    case "call.leave":
      leaveConversationCall(socket, state, parsed.data.conversationId);
      break;
    case "call.signal":
      await relayCallSignal(
        socket,
        state,
        parsed.data.conversationId,
        parsed.data.peerUserId,
        parsed.data.signal,
      );
      break;
    case "user.subscribe":
      await subscribeToUserPresence(socket, state);
      break;
    case "subscribe":
      await subscribeToConversation(socket, state, parsed.data.conversationId);
      break;
    case "unsubscribe":
      await unsubscribeFromConversation(socket, parsed.data.conversationId);
      sendJson(socket, {
        type: "unsubscribed",
        conversationId: parsed.data.conversationId,
      });
      break;
    case "message.publish":
      await publishMessage(socket, state, parsed.data.messageId);
      break;
    case "message.reactions.publish":
      await publishMessageReactions(socket, state, parsed.data.messageId);
      break;
    case "typing.update":
      await publishTyping(
        socket,
        state,
        parsed.data.conversationId,
        parsed.data.isTyping,
      );
      break;
    case "conversation.read":
      await publishConversationRead(
        socket,
        state,
        parsed.data.conversationId,
      );
      break;
    case "friend.request.publish":
      await publishFriendRequestUpdate(
        socket,
        state,
        parsed.data.requestId,
        parsed.data.status,
      );
      break;
  }
}
