"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function blockUser(blockedId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const blockerId = session.user.id;

  if (blockerId === blockedId)
    return { success: false, error: "You cannot block yourself" };

  // Verify the target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: blockedId },
    select: { id: true },
  });
  if (!targetUser) return { success: false, error: "User not found" };

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId },
    update: {},
  });

  return { success: true };
}

export async function unblockUser(blockedId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await prisma.block.deleteMany({
    where: { blockerId: session.user.id, blockedId },
  });

  return { success: true };
}

export async function getBlockStatus(otherUserId: string) {
  const session = await getSession();
  if (!session?.user) return { iBlocked: false, theyBlocked: false };

  const userId = session.user.id;

  const [iBlocked, theyBlocked] = await Promise.all([
    prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId: userId, blockedId: otherUserId },
      },
    }),
    prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId: otherUserId, blockedId: userId },
      },
    }),
  ]);

  return {
    iBlocked: !!iBlocked,
    theyBlocked: !!theyBlocked,
  };
}
