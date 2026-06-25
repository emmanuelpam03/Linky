"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

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

  // Confirm user is a member of the conversation
  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
  });

  if (!membership)
    return { success: false, error: "Not a member of this conversation" };

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      text: text.trim(),
    },
    select: {
      id: true,
      text: true,
      imageUrl: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      createdAt: true,
      senderId: true,
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

  // Update conversation's lastMessageAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: message.createdAt },
  });

  return { success: true, data: message };
}
