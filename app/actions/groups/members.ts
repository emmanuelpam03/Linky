"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function addGroupMember(conversationId: string, userId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const requesterId = session.user.id;

  // Only admins can add members
  const requesterMembership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: requesterId, role: "ADMIN" },
  });

  if (!requesterMembership) {
    return { success: false, error: "Only admins can add members" };
  }

  // Must be friends with the requester
  const areFriends = await prisma.friend.findFirst({
    where: { userId: requesterId, friendId: userId },
  });

  if (!areFriends) {
    return { success: false, error: "You can only add friends to the group" };
  }

  const existingMembership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
  });

  if (existingMembership) {
    return { success: false, error: "User is already a member" };
  }

  await prisma.conversationMember.create({
    data: { conversationId, userId, role: "MEMBER" },
  });

  return { success: true };
}

export async function removeGroupMember(
  conversationId: string,
  userId: string,
) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const requesterId = session.user.id;

  // Can remove self, or admin can remove others
  if (requesterId !== userId) {
    const requesterMembership = await prisma.conversationMember.findFirst({
      where: { conversationId, userId: requesterId, role: "ADMIN" },
    });
    if (!requesterMembership) {
      return { success: false, error: "Only admins can remove members" };
    }
  }

  // Check if target is the last admin
  const targetMembership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
  });
  if (targetMembership?.role === "ADMIN") {
    const adminCount = await prisma.conversationMember.count({
      where: { conversationId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return {
        success: false,
        error: "Cannot remove the last admin of the group",
      };
    }
  }

  await prisma.conversationMember.deleteMany({
    where: { conversationId, userId },
  });

  return { success: true };
}

export async function promoteToAdmin(conversationId: string, userId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const requesterId = session.user.id;

  // Only admins can promote
  const requesterMembership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: requesterId, role: "ADMIN" },
  });

  if (!requesterMembership) {
    return { success: false, error: "Only admins can promote members" };
  }

  await prisma.conversationMember.updateMany({
    where: { conversationId, userId },
    data: { role: "ADMIN" },
  });

  return { success: true };
}
