import { WebSocket } from "ws";
import prisma from "../../lib/prisma";

export type ClientState = {
  userId: string;
  name: string;
  subscriptions: Set<string>;
  lastTypingUpdate: Map<string, number>;
};

const clientStates = new WeakMap<WebSocket, ClientState>();
const conversationClients = new Map<string, Set<WebSocket>>();
const userClients = new Map<string, Set<WebSocket>>();

export function setClientState(socket: WebSocket, state: ClientState) {
  clientStates.set(socket, state);
  const clients = userClients.get(state.userId) ?? new Set<WebSocket>();
  clients.add(socket);
  userClients.set(state.userId, clients);
}

export function getClientState(socket: WebSocket) {
  return clientStates.get(socket);
}

export function clearClientState(socket: WebSocket) {
  const state = clientStates.get(socket);
  if (state) {
    const clients = userClients.get(state.userId);
    clients?.delete(socket);
    if (clients?.size === 0) userClients.delete(state.userId);
  }
  clientStates.delete(socket);
}

export function getUserClients(userId: string) {
  return userClients.get(userId) ?? new Set<WebSocket>();
}

export function getConversationClients(conversationId: string) {
  return conversationClients.get(conversationId) ?? new Set<WebSocket>();
}

export async function getConversationMemberIds(conversationId: string) {
  const memberships = await prisma.conversationMember.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  return new Set(memberships.map((membership) => membership.userId));
}

export function sendJson(socket: WebSocket, value: unknown) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(value), (error) => {
    if (error) {
      console.error("Failed to send a WebSocket event:", error.message);
    }
  });
}

export function removeSubscription(socket: WebSocket, conversationId: string) {
  const state = clientStates.get(socket);
  if (!state) return;

  state.subscriptions.delete(conversationId);
  state.lastTypingUpdate.delete(conversationId);
  const clients = conversationClients.get(conversationId);
  clients?.delete(socket);
  if (clients?.size === 0) {
    conversationClients.delete(conversationId);
  }
}

export function addConversationClient(
  socket: WebSocket,
  state: ClientState,
  conversationId: string,
) {
  state.subscriptions.add(conversationId);
  const clients = conversationClients.get(conversationId) ?? new Set<WebSocket>();
  clients.add(socket);
  conversationClients.set(conversationId, clients);
}
