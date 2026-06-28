"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function searchUsersForGroup(
  query: string,
  conversationId: string,
) {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: [] };

  const trimmedQuery = query.trim();
  if (!trimmedQuery) return { success: true, data: [] };

  const userId = session.user.id;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      type: "GROUP",
      members: { some: { userId } },
    },
    select: { id: true },
  });
  if (!conversation)
    return { success: false, error: "Not a member of this group", data: [] };

  // Get existing member IDs
  const members = await prisma.conversationMember.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  const memberIds = new Set(members.map((m) => m.userId));

  // Get blocked user IDs in both directions
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
    select: { blockerId: true, blockedId: true },
  });

  const blockedIds = new Set(
    blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)),
  );

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: userId } },
        { id: { notIn: [...memberIds] } },
        { id: { notIn: [...blockedIds] } },
        {
          OR: [
            { name: { contains: trimmedQuery, mode: "insensitive" } },
            { username: { contains: trimmedQuery, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
    },
    take: 10,
  });

  return { success: true, data: users };
}
