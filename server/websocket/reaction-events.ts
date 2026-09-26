import { WebSocket } from "ws";
import { buildReactionSummary } from "../../lib/message-interactions";
import prisma from "../../lib/prisma";
import {
  getClientState,
  getConversationClients,
  getConversationMemberIds,
  sendJson,
  type ClientState,
} from "./connection-state";
import { unsubscribeFromConversation } from "./presence-events";

export async function publishMessageReactions(
  socket: WebSocket,
  state: ClientState,
  messageId: string,
) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      conversationId: true,
      deletedForEveryone: true,
      reactions: { select: { reaction: true, userId: true } },
    },
  });

  if (
    !message ||
    message.deletedForEveryone ||
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
    sendJson(socket, { type: "error", code: "not_a_member", messageId });
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

    sendJson(recipient, {
      type: "message.reactions.updated",
      conversationId: message.conversationId,
      messageId: message.id,
      reactions: buildReactionSummary(
        message.reactions,
        recipientState.userId,
      ),
    });
  }

  sendJson(socket, {
    type: "message.reactions.published",
    messageId: message.id,
  });
}
