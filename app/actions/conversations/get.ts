"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import type { GroupDetail, RawGroup, RawGroupConversation } from "@/types";

export async function getGroup(conversationId: string): Promise<{
  success: boolean;
  error?: string;
  data: GroupDetail | null;
}> {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: null };

  const userId = session.user.id;

  const raw = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      type: "GROUP",
      members: { some: { userId } },
    },
    include: {
      creator: {
        select: { name: true, username: true },
      },
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
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!raw) return { success: false, error: "Group not found", data: null };

  const conversation = raw as unknown as RawGroup;
  const myMembership = conversation.members.find((m) => m.userId === userId);

  return {
    success: true,
    data: {
      id: conversation.id,
      name: conversation.name ?? "Unnamed group",
      description: conversation.description ?? null,
      image: conversation.image ?? null,
      createdBy: conversation.createdBy,
      createdAt: conversation.createdAt,
      creator: conversation.creator,
      memberCount: conversation.members.length,
      members: conversation.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role as "ADMIN" | "MEMBER",
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      currentUserRole: (myMembership?.role ?? "MEMBER") as "ADMIN" | "MEMBER",
      isMuted: myMembership?.isMuted ?? false,
    },
  };
}
