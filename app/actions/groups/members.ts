"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function addGroupMember(conversationId: string, userId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const requesterId = session.user.id;

  // Any member can add — just verify requester is a member
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      type: "GROUP",
      members: { some: { userId: requesterId } },
    },
    select: { id: true },
  });
  if (!conversation)
    return { success: false, error: "You are not a member of this group" };

  // Check block in either direction
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: requesterId, blockedId: userId },
        { blockerId: userId, blockedId: requesterId },
      ],
    },
  });
  if (block) return { success: false, error: "Cannot add this user" };

  // Check not already a member
  const alreadyMember = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
  });
  if (alreadyMember)
    return { success: false, error: "User is already in the group" };

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

  if (requesterId !== userId) {
    const requesterMembership = await prisma.conversationMember.findFirst({
      where: { conversationId, userId: requesterId, role: "ADMIN" },
    });
    if (!requesterMembership)
      return { success: false, error: "Only admins can remove members" };
  }

  // Prevent removing the last admin — check + delete atomically
  try {
    await prisma.$transaction(async (tx) => {
      const targetMember = await tx.conversationMember.findFirst({
        where: { conversationId, userId, role: "ADMIN" },
        select: { id: true },
      });

      if (targetMember) {
        const adminCount = await tx.conversationMember.count({
          where: { conversationId, role: "ADMIN" },
        });
        if (adminCount <= 1) {
          throw new Error("Cannot remove the last admin of the group");
        }
      }

      await tx.conversationMember.deleteMany({
        where: { conversationId, userId },
      });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Cannot remove the last admin of the group"
    ) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  return { success: true };
}

export async function promoteToAdmin(conversationId: string, userId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const requesterId = session.user.id;

  const requesterMembership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: requesterId, role: "ADMIN" },
  });
  if (!requesterMembership)
    return { success: false, error: "Only admins can promote members" };

  await prisma.conversationMember.updateMany({
    where: { conversationId, userId },
    data: { role: "ADMIN" },
  });

  return { success: true };
}
