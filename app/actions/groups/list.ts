"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import type { ConversationWithIncludes, GroupListItem, RawGroupConversation } from "@/types";

export async function getGroups(): Promise<{
  success: boolean;
  error?: string;
  data: GroupListItem[];
}> {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: [] };

  const userId = session.user.id;

  const raw = await prisma.conversation.findMany({
    where: {
      type: "GROUP",
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
          fileName: true,
          sender: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const data: GroupListItem[] = (raw as unknown as RawGroupConversation[]).map((c) => {
  const lastMsg = c.messages[0] ?? null;
  const myMembership = c.members.find((m) => m.userId === userId);

  const lastMessageText = lastMsg
    ? `${lastMsg.sender.name}: ${
        lastMsg.text ??
        (lastMsg.imageUrl
          ? "sent a photo"
          : lastMsg.fileName ?? "sent a file")
      }`
    : null;

  return {
    id: c.id,
    name: c.name ?? "Unnamed group",
    description: c.description,
    image: c.image,
    lastMessageAt: c.lastMessageAt,
    lastMessage: lastMessageText,
    memberCount: c.members.length,
    role: (myMembership?.role ?? "MEMBER") as "ADMIN" | "MEMBER",
  };
});

  return { success: true, data };
}
