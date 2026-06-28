"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
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

  // All checks + delete inside serializable transaction to prevent races
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.$transaction(
        async (tx) => {
          // Requester authorization — inside transaction to avoid stale state
          if (requesterId !== userId) {
            const requesterMembership = await tx.conversationMember.findFirst({
              where: { conversationId, userId: requesterId, role: "ADMIN" },
            });
            if (!requesterMembership) {
              throw new Error("Only admins can remove members");
            }
          }

          // Prevent removing the last admin
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
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return { success: true };
    } catch (error) {
      // Retry on serialization failure (concurrent modification detected)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        if (attempt < 2) continue;
      }

      // Known sentinel errors from our business-logic checks
      if (
        error instanceof Error &&
        (error.message === "Cannot remove the last admin of the group" ||
          error.message === "Only admins can remove members")
      ) {
        return { success: false, error: error.message };
      }

      throw error;
    }
  }

  // Unreachable — all paths above return or throw
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
