import { WebSocket } from "ws";
import prisma from "../../lib/prisma";
import {
  getUserClients,
  sendJson,
  type ClientState,
} from "./connection-state";

export async function subscribeToUserPresence(
  socket: WebSocket,
  state: ClientState,
) {
  const friends = await prisma.friend.findMany({
    where: { userId: state.userId },
    select: {
      friendId: true,
      friend: { select: { name: true } },
    },
  });

  sendJson(socket, {
    type: "user.presence.snapshot",
    users: friends.flatMap((friend) =>
      getUserClients(friend.friendId).size > 0
        ? [{ userId: friend.friendId, name: friend.friend.name }]
        : [],
    ),
  });
}

export async function broadcastUserPresenceToFriends(
  userId: string,
  name: string,
) {
  const isOnline = getUserClients(userId).size > 0;
  const friendships = await prisma.friend.findMany({
    where: { userId },
    select: { friendId: true },
  });

  for (const friendId of new Set(friendships.map(({ friendId }) => friendId))) {
    for (const recipient of getUserClients(friendId)) {
      sendJson(recipient, {
        type: "user.presence.updated",
        userId,
        name,
        isOnline,
      });
    }
  }
}
