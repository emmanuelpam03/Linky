"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import type { MessageItem, MessageWithSender } from "@/types";

const PAGE_SIZE = 50;

export async function getMessages(
  conversationId: string,
  cursor?: string, // message id to paginate from
): Promise<{
  success: boolean;
  error?: string;
  data: MessageItem[];
  nextCursor: string | null;
}> {
  const session = await getSession();
  if (!session?.user)
    return {
      success: false,
      error: "Unauthorized",
      data: [],
      nextCursor: null,
    };

  const userId = session.user.id;

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
  });

  if (!membership)
    return {
      success: false,
      error: "Not a member",
      data: [],
      nextCursor: null,
    };

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
    orderBy: { createdAt: "desc" }, // fetch newest first
    take: PAGE_SIZE + 1, // fetch one extra to know if there's a next page
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1, // skip the cursor message itself
        }
      : {}),
  });

  const messages = raw as unknown as MessageWithSender[];

  const hasMore = messages.length > PAGE_SIZE;
  const page = hasMore ? messages.slice(0, PAGE_SIZE) : messages;

  // Reverse so oldest is at the top
  const ordered = [...page].reverse();

  return {
    success: true,
    nextCursor: hasMore ? page[page.length - 1].id : null,
    data: ordered.map((m) => ({
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
      deletedForEveryone: m.deletedForEveryone,
      deletedForSelf: m.deletedFor.includes(userId),
    })),
  };
}
