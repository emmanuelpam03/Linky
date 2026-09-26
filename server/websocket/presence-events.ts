import { WebSocket } from "ws";
import {
  addConversationClient,
  clearClientState,
  getClientState,
  getConversationClients,
  getConversationMemberIds,
  removeSubscription,
  sendJson,
  type ClientState,
} from "./connection-state";

async function broadcastPresenceUpdate(
  conversationId: string,
  userId: string,
  name: string,
  isOnline: boolean,
) {
  const memberIds = await getConversationMemberIds(conversationId);
  const clients = getConversationClients(conversationId);

  for (const recipient of clients) {
    const recipientState = getClientState(recipient);
    if (
      !recipientState ||
      recipientState.userId === userId ||
      !recipientState.subscriptions.has(conversationId) ||
      !memberIds.has(recipientState.userId)
    ) {
      continue;
    }

    sendJson(recipient, {
      type: "presence.updated",
      conversationId,
      userId,
      name,
      isOnline,
    });
  }
}

export async function subscribeToConversation(
  socket: WebSocket,
  state: ClientState,
  conversationId: string,
) {
  const memberIds = await getConversationMemberIds(conversationId);
  if (!memberIds.has(state.userId)) {
    sendJson(socket, { type: "error", code: "not_a_member" });
    return;
  }

  const clients = getConversationClients(conversationId);
  const wasOnline = [...clients].some(
    (client) => getClientState(client)?.userId === state.userId,
  );
  addConversationClient(socket, state, conversationId);

  const onlineUsers = new Map<string, string>();
  for (const client of getConversationClients(conversationId)) {
    const clientState = getClientState(client);
    if (clientState && memberIds.has(clientState.userId)) {
      onlineUsers.set(clientState.userId, clientState.name);
    }
  }

  sendJson(socket, { type: "subscribed", conversationId });
  sendJson(socket, {
    type: "presence.snapshot",
    conversationId,
    users: [...onlineUsers].map(([userId, name]) => ({ userId, name })),
  });

  if (!wasOnline) {
    await broadcastPresenceUpdate(
      conversationId,
      state.userId,
      state.name,
      true,
    );
  }
}

export async function unsubscribeFromConversation(
  socket: WebSocket,
  conversationId: string,
) {
  const state = getClientState(socket);
  if (!state?.subscriptions.has(conversationId)) return;

  const isLastConnection = ![...getConversationClients(conversationId)].some(
    (client) =>
      client !== socket &&
      getClientState(client)?.userId === state.userId &&
      getClientState(client)?.subscriptions.has(conversationId),
  );
  removeSubscription(socket, conversationId);

  if (isLastConnection) {
    await broadcastPresenceUpdate(
      conversationId,
      state.userId,
      state.name,
      false,
    );
  }
}

export async function removeClient(socket: WebSocket) {
  const state = getClientState(socket);
  if (!state) return;

  const results = await Promise.allSettled(
    [...state.subscriptions].map((conversationId) =>
      unsubscribeFromConversation(socket, conversationId),
    ),
  );
  clearClientState(socket);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error(
        "Failed to broadcast WebSocket presence cleanup:",
        result.reason,
      );
    }
  }
}
