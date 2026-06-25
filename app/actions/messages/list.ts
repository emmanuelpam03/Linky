"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import type { MessageItem, MessageWithSender } from "@/types";

export async function getMessages(conversationId: string): Promise<{
  success: boolean;
  error?: string;
  data: MessageItem[];
}> {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: [] };

  const userId = session.user.id;

  // Confirm membership
  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
  });

  if (!membership) return { success: false, error: "Not a member", data: [] };

  const raw = await prisma.message.findMany({
    where: { conversationId },
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
    orderBy: { createdAt: "asc" },
  });

  const messages = raw as unknown as MessageWithSender[];

  return {
    success: true,
    data: messages.map((m) => ({
      id: m.id,
      text: m.text,
      imageUrl: m.imageUrl,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      fileSize: m.fileSize,
      createdAt: m.createdAt,
      senderId: m.senderId,
      sender: m.sender,
      isOwn: m.senderId === userId,
    })),
  };
}
