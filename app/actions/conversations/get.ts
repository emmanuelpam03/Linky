"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import { ConversationDetail } from "@/types";

export async function getConversation(conversationId: string): Promise<{
  success: boolean;
  error?: string;
  data: ConversationDetail | null;
}> {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: null };

  const userId = session.user.id;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      members: { some: { userId } }, // ensure user is a member
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
    },
  });

  if (!conversation)
    return { success: false, error: "Conversation not found", data: null };

  const otherMember =
    conversation.type === "DIRECT"
      ? conversation.members.find((m) => m.userId !== userId)
      : null;

  return {
    success: true,
    data: {
      id: conversation.id,
      type: conversation.type,
      name:
        conversation.type === "DIRECT"
          ? (otherMember?.user.name ?? "Unknown")
          : (conversation.name ?? "Group"),
      image:
        conversation.type === "DIRECT"
          ? (otherMember?.user.image ?? null)
          : (conversation.image ?? null),
      otherUser: otherMember?.user ?? null,
    },
  };
}
