"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function addGroupMember(conversationId: string, userId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const requesterId = session.user.id;

  // Any member can add — just verify requester is a member
  const requesterMembership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: requesterId },
  });
  if (!requesterMembership)
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

  await prisma.conversationMember.deleteMany({
    where: { conversationId, userId },
  });

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
