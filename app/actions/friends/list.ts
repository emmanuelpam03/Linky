"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import type { FriendRequest, Friend, FriendRequestWithSender, FriendRequestWithReceiver, FriendshipWithFriend } from "@/types";


export async function getIncomingRequests(): Promise<{
  success: boolean;
  error?: string;
  data: FriendRequest[];
}> {
  const session = await getSession();

  if (!session?.user) {
    return {
      success: false,
      error: "Unauthorized",
      data: [],
    };
  }

  const requests = await prisma.friendRequest.findMany({
    where: {
      receiverId: session.user.id,
      status: "PENDING",
    },
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    success: true,
    data: (requests as FriendRequestWithSender[]).map((r) => ({
      id: r.id,
      status: r.status as FriendRequest["status"],
      createdAt: r.createdAt,
      sender: r.sender,
      receiver: {
        id: session.user.id,
        name: "",
        username: "",
        image: null,
      },
    })),
  };
}

export async function getSentRequests(): Promise<{
  success: boolean;
  error?: string;
  data: FriendRequest[];
}> {
  const session = await getSession();

  if (!session?.user) {
    return {
      success: false,
      error: "Unauthorized",
      data: [],
    };
  }

  const requests = await prisma.friendRequest.findMany({
    where: {
      senderId: session.user.id,
      status: "PENDING",
    },
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    success: true,
    data: (requests as FriendRequestWithReceiver[]).map((r) => ({
      id: r.id,
      status: r.status as FriendRequest["status"],
      createdAt: r.createdAt,
      sender: {
        id: session.user.id,
        name: "",
        username: "",
        image: null,
      },
      receiver: r.receiver,
    })),
  };
}

export async function getFriends(): Promise<{
  success: boolean;
  error?: string;
  data: Friend[];
}> {
  const session = await getSession();

  if (!session?.user) {
    return {
      success: false,
      error: "Unauthorized",
      data: [],
    };
  }

  const friendships = await prisma.friend.findMany({
    where: {
      userId: session.user.id,
    },
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    success: true,
    data: (friendships as FriendshipWithFriend[]).map((f) => ({
      id: f.friend.id,
      name: f.friend.name,
      username: f.friend.username,
      image: f.friend.image,
    })),
  };
}

export async function getPendingRequestCount(): Promise<number> {
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
          { userId: session.user.id, friendId: friendId },
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