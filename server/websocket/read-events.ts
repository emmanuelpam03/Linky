import { WebSocket } from "ws";
import prisma from "../../lib/prisma";
import {
  getClientState,
  getConversationClients,
  getConversationMemberIds,
  removeSubscription,
  sendJson,
  type ClientState,
} from "./connection-state";

export async function sendReadSnapshot(
  socket: WebSocket,
  state: ClientState,
  conversationId: string,
) {
  const memberships = await prisma.conversationMember.findMany({
    where: { conversationId, userId: { not: state.userId } },
    select: {
      userId: true,
      lastReadAt: true,
      user: { select: { name: true } },
    },
  });

  sendJson(socket, {
    type: "read.snapshot",
    conversationId,
    readers: memberships.flatMap((membership) =>
      membership.lastReadAt
        ? [
            {
              userId: membership.userId,
              name: membership.user.name,
              lastReadAt: membership.lastReadAt.toISOString(),
            },
          ]
        : [],
    ),
  });
}

export async function publishConversationRead(
  socket: WebSocket,
  state: ClientState,
  conversationId: string,
) {
  if (!state.subscriptions.has(conversationId)) {
    sendJson(socket, { type: "error", code: "not_subscribed" });
    return;
  }

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: state.userId },
    select: { id: true },
  });
  if (!membership) {
    removeSubscription(socket, conversationId);
    sendJson(socket, { type: "error", code: "not_a_member" });
    return;
  }

  const lastReadAt = new Date();
  await prisma.conversationMember.update({
    where: { id: membership.id },
    data: { lastReadAt },
  });

  const memberIds = await getConversationMemberIds(conversationId);
  for (const recipient of getConversationClients(conversationId)) {
    const recipientState = getClientState(recipient);
    if (
      !recipientState ||
      recipientState.userId === state.userId ||
      !recipientState.subscriptions.has(conversationId) ||
      !memberIds.has(recipientState.userId)
    ) {
      continue;
    }

    sendJson(recipient, {
      type: "read.updated",
      conversationId,
      userId: state.userId,
      name: state.name,
      lastReadAt: lastReadAt.toISOString(),
    });
  }

  sendJson(socket, { type: "read.published", conversationId });
}
