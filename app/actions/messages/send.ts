"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import type { MessageItem } from "@/types";

export async function sendMessage({
  conversationId,
  text,
}: {
  conversationId: string;
  text: string;
}) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = session.user.id;

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
  });
  if (!membership)
    return { success: false, error: "Not a member of this conversation" };

  // For direct conversations, check if either user has blocked the other
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: { select: { userId: true } },
    },
  });

  if (conversation?.type === "DIRECT") {
    const otherMember = conversation.members.find((m) => m.userId !== userId);
    if (otherMember) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: otherMember.userId },
            { blockerId: otherMember.userId, blockedId: userId },
          ],
        },
      });
      if (block)
        return {
          success: false,
          error: "You cannot send messages to this user",
        };
    }
  }

  const trimmedText = text.trim();
  if (!trimmedText) return { success: false, error: "Message cannot be empty" };

  const raw = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      text: trimmedText,
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
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: raw.createdAt },
  });

  return {
    success: true,
    data: {
      id: raw.id,
      text: raw.text,
      imageUrl: raw.imageUrl,
      fileUrl: raw.fileUrl,
      fileName: raw.fileName,
      fileSize: raw.fileSize,
      createdAt: raw.createdAt,
      senderId: raw.senderId,
      sender: raw.sender,
      isOwn: true,
      deletedForEveryone: false,
      deletedForSelf: false,
    } as MessageItem,
  };
}
