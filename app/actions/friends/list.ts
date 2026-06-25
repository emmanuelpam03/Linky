"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function getFriends() {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: [] };

  const friends = await prisma.friend.findMany({
    where: { userId: session.user.id },
    include: {
      friend: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: friends.map((f) => f.friend) };
}

export async function getIncomingRequests() {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: [] };

  const requests = await prisma.friendRequest.findMany({
    where: { receiverId: session.user.id, status: "PENDING" },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: requests };
}

export async function getSentRequests() {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: [] };

  const requests = await prisma.friendRequest.findMany({
    where: { senderId: session.user.id, status: "PENDING" },
    include: {
      receiver: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: requests };
}

export async function getPendingRequestCount() {
  const session = await getSession();
  if (!session?.user) return 0;

  return prisma.friendRequest.count({
    where: { receiverId: session.user.id, status: "PENDING" },
  });
}

export async function removeFriend(friendId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await prisma.$transaction([
    prisma.friend.deleteMany({
      where: {
        OR: [
          { userId: session.user.id, friendId },
          { userId: friendId, friendId: session.user.id },
        ],
      },
    }),
    prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: friendId },
          { senderId: friendId, receiverId: session.user.id },
        ],
      },
    }),
  ]);

  return { success: true };
}
