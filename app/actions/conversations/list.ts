"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import { ConversationListItem, ConversationWithIncludes } from "@/types";

export async function getConversations(): Promise<{
  success: boolean;
  error?: string;
  data: ConversationListItem[];
}> {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: [] };

  const userId = session.user.id;

  const raw = await prisma.conversation.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          text: true,
          imageUrl: true,
          fileUrl: true,
          fileName: true,
          createdAt: true,
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const conversations = raw as unknown as ConversationWithIncludes[];

  const data: ConversationListItem[] = conversations.map((c) => {
    const lastMsg = c.messages[0] ?? null;
    const otherMember =
      c.type === "DIRECT" ? c.members.find((m) => m.userId !== userId) : null;

    const lastMessageText = lastMsg
      ? (lastMsg.text ??
        (lastMsg.imageUrl
          ? "Sent a photo"
          : (lastMsg.fileName ?? "Sent a file")))
      : null;

    return {
      id: c.id,
      type: c.type,
      name:
        c.type === "DIRECT"
          ? (otherMember?.user.name ?? "Unknown")
          : (c.name ?? "Group"),
      image:
        c.type === "DIRECT"
          ? (otherMember?.user.image ?? null)
          : (c.image ?? null),
      lastMessageAt: c.lastMessageAt,
      lastMessage: lastMessageText,
      unreadCount: 0,
      otherUser: otherMember?.user ?? null,
    };
  });

  return { success: true, data };
}
