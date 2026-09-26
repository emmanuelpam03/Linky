import { WebSocket } from "ws";
import prisma from "../../lib/prisma";
import {
  getUserClients,
  sendJson,
  type ClientState,
} from "./connection-state";
import { unsubscribeFromConversation } from "./presence-events";

export async function publishTyping(
  socket: WebSocket,
  state: ClientState,
  conversationId: string,
  isTyping: boolean,
) {
  if (!state.subscriptions.has(conversationId)) {
    sendJson(socket, { type: "error", code: "not_subscribed" });
    return;
  }

  const now = Date.now();
  const lastUpdate = state.lastTypingUpdate.get(conversationId) ?? 0;
  if (isTyping && now - lastUpdate < 1000) return;

  if (isTyping) {
    state.lastTypingUpdate.set(conversationId, now);
  } else {
    state.lastTypingUpdate.delete(conversationId);
  }

  const memberships = await prisma.conversationMember.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  const memberIds = new Set(memberships.map((membership) => membership.userId));

  if (!memberIds.has(state.userId)) {
    await unsubscribeFromConversation(socket, conversationId);
    sendJson(socket, { type: "error", code: "not_a_member" });
    return;
  }

  for (const userId of memberIds) {
    if (userId === state.userId) continue;

    for (const recipient of getUserClients(userId)) {
      sendJson(recipient, {
        type: "typing.updated",
        conversationId,
        userId: state.userId,
        name: state.name,
        isTyping,
      });
    }
  }
}
