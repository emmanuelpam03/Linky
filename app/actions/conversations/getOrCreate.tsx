"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function getOrCreateDirectConversation(friendId: string) {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", conversationId: null };

  const userId = session.user.id;

  if (friendId === userId)
    return {
      success: false,
      error: "Cannot start a conversation with yourself",
      conversationId: null,
    };

  // Check if a direct conversation already exists between both users
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: friendId } } },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    return { success: true, conversationId: existing.id };
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      type: "DIRECT",
      createdBy: userId,
      members: {
        create: [
          { userId, role: "MEMBER" },
          { userId: friendId, role: "MEMBER" },
        ],
      },
    },
    select: { id: true },
  });

  return { success: true, conversationId: conversation.id };
}
