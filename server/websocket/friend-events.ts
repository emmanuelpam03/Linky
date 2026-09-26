import { WebSocket } from "ws";
import prisma from "../../lib/prisma";
import { getUserClients, sendJson, type ClientState } from "./connection-state";

export async function publishFriendRequestUpdate(
  socket: WebSocket,
  state: ClientState,
  requestId: string,
  status: "PENDING" | "ACCEPTED",
) {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    select: { id: true, senderId: true, receiverId: true, status: true },
  });

  const isAuthorized =
    request &&
    request.status === status &&
    (status === "PENDING"
      ? request.senderId === state.userId
      : request.receiverId === state.userId);
  if (!isAuthorized || !request) {
    sendJson(socket, {
      type: "error",
      code: "friend_request_unavailable",
      requestId,
    });
    return;
  }

  const event = {
    type: "friend.request.updated",
    requestId: request.id,
    senderId: request.senderId,
    receiverId: request.receiverId,
    status,
  };

  for (const userId of new Set([request.senderId, request.receiverId])) {
    for (const recipient of getUserClients(userId)) {
      sendJson(recipient, event);
    }
  }

  sendJson(socket, { type: "friend.request.published", requestId, status });
}
