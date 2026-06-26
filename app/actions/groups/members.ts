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

const LAST_ADMIN_ERROR = "Cannot remove the last admin of the group";

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

  // Serialisable transaction protects the admin invariant from
  // write-skew under concurrency.  On a P2034 (write conflict) the
  // transaction is retried with fresh state.
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          if (requesterId !== userId) {
            const requesterMembership = await tx.conversationMember.findFirst({
              where: { conversationId, userId: requesterId, role: "ADMIN" },
              select: { id: true },
            });
            if (!requesterMembership) {
              return {
                success: false,
                error: "Only admins can remove members",
              };
            }
          }

          const deleted = await tx.conversationMember.deleteMany({
            where: { conversationId, userId },
          });
          if (deleted.count === 0) {
            return { success: false, error: "Member not found" };
          }
          const adminCount = await tx.conversationMember.count({
            where: { conversationId, role: "ADMIN" },
          });
          if (adminCount === 0) {
            throw new Error(LAST_ADMIN_ERROR);
          }
          return { success: true };
        },
        { isolationLevel: "Serializable" },
      );
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        "code" in err &&
        (err as { code: string }).code === "P2034" &&
        attempt < MAX_RETRIES - 1
      ) {
        continue;
      }
      if (err instanceof Error && err.message === LAST_ADMIN_ERROR) {
        return { success: false, error: LAST_ADMIN_ERROR };
      }
      throw err;
    }
  }
  // Unreachable, but satisfy TypeScript
  return { success: false, error: "Unexpected error" };
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
