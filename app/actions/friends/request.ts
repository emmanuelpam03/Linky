"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function sendFriendRequest(receiverId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const senderId = session.user.id;

  if (senderId === receiverId) {
    return {
      success: false,
      error: "You cannot send a friend request to yourself",
    };
  }

  // Check if already friends
  const alreadyFriends = await prisma.friend.findFirst({
    where: { userId: senderId, friendId: receiverId },
  });
  if (alreadyFriends) {
    return { success: false, error: "You are already friends" };
  }

  // Check if request already exists in either direction
  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "PENDING") {
      return { success: false, error: "A friend request already exists" };
    }
    if (existing.status === "ACCEPTED") {
      return { success: false, error: "You are already friends" };
    }
    // If previously rejected, delete and allow resend
    await prisma.friendRequest.delete({ where: { id: existing.id } });
  }

  const request = await prisma.friendRequest.create({
    data: { senderId, receiverId },
  });

  return { success: true, data: request };
}

export async function acceptFriendRequest(requestId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) return { success: false, error: "Request not found" };
  if (request.receiverId !== session.user.id)
    return { success: false, error: "Unauthorized" };
  if (request.status !== "PENDING")
    return { success: false, error: "Request is no longer pending" };

  // Run in a transaction — update request + create both friend rows atomically
  await prisma.$transaction([
    prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    }),
    prisma.friend.createMany({
      data: [
        { userId: request.senderId, friendId: request.receiverId },
        { userId: request.receiverId, friendId: request.senderId },
      ],
      skipDuplicates: true,
    }),
  ]);

  return { success: true };
}

export async function rejectFriendRequest(requestId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) return { success: false, error: "Request not found" };
  if (request.receiverId !== session.user.id)
    return { success: false, error: "Unauthorized" };
  if (request.status !== "PENDING")
    return { success: false, error: "Request is no longer pending" };

  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
  });

  return { success: true };
}

export async function cancelFriendRequest(requestId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) return { success: false, error: "Request not found" };
  if (request.senderId !== session.user.id)
    return { success: false, error: "Unauthorized" };
  if (request.status !== "PENDING")
    return { success: false, error: "Request is no longer pending" };

  await prisma.friendRequest.delete({ where: { id: requestId } });

  return { success: true };
}
