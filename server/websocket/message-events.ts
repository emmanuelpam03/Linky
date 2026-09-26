import { WebSocket } from "ws";
import { buildReactionSummary } from "../../lib/message-interactions";
import prisma from "../../lib/prisma";
import type { MessageItem } from "../../types";
import {
  getClientState,
  getConversationClients,
  getConversationMemberIds,
  sendJson,
  type ClientState,
} from "./connection-state";
import { unsubscribeFromConversation } from "./presence-events";

export async function publishMessage(
  socket: WebSocket,
  state: ClientState,
  messageId: string,
) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      conversationId: true,
      text: true,
      editedAt: true,
      imageUrl: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      createdAt: true,
      senderId: true,
      deletedFor: true,
      deletedForEveryone: true,
      sender: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      replyTo: {
        select: {
          id: true,
          text: true,
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      },
      reactions: {
        select: {
          reaction: true,
          userId: true,
        },
      },
    },
  });

  if (
    !message ||
    message.senderId !== state.userId ||
    !state.subscriptions.has(message.conversationId)
  ) {
    sendJson(socket, {
      type: "error",
      code: "message_unavailable",
      messageId,
    });
    return;
  }

  const memberIds = await getConversationMemberIds(message.conversationId);
  if (!memberIds.has(state.userId)) {
    await unsubscribeFromConversation(socket, message.conversationId);
    sendJson(socket, {
      type: "error",
      code: "not_a_member",
      messageId,
    });
    return;
  }

  for (const recipient of getConversationClients(message.conversationId)) {
    const recipientState = getClientState(recipient);
    if (
      !recipientState ||
      !recipientState.subscriptions.has(message.conversationId) ||
      !memberIds.has(recipientState.userId)
    ) {
      continue;
    }

    const messageItem: MessageItem = {
      id: message.id,
      text: message.text,
      imageUrl: message.imageUrl,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      createdAt: message.createdAt,
      senderId: message.senderId,
      sender: message.sender,
      isOwn: message.senderId === recipientState.userId,
      deletedForEveryone: message.deletedForEveryone,
      deletedForSelf: message.deletedFor.includes(recipientState.userId),
      editedAt: message.editedAt,
      reactions: buildReactionSummary(message.reactions, recipientState.userId),
      replyTo: message.replyTo,
    };

    sendJson(recipient, {
      type: "message.created",
      conversationId: message.conversationId,
      message: messageItem,
    });
  }

  sendJson(socket, { type: "message.published", messageId });
}
