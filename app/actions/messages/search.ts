"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import type { MessageItem } from "@/types";

const MAX_QUERY_LENGTH = 200;
const MAX_RESULTS = 50;

export async function searchMessages(
  conversationId: string,
  query: string,
): Promise<{ success: boolean; error?: string; data: MessageItem[] }> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized", data: [] };
  }

  const normalizedQuery = query.trim().slice(0, MAX_QUERY_LENGTH);
  if (!normalizedQuery) return { success: true, data: [] };

  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: session.user.id } },
    select: { id: true },
  });
  if (!membership) {
    return { success: false, error: "Not a member", data: [] };
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      text: { contains: normalizedQuery, mode: "insensitive" },
      deletedForEveryone: false,
      NOT: { deletedFor: { has: session.user.id } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MAX_RESULTS,
    select: {
      id: true,
      text: true,
      editedAt: true,
      imageUrl: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      createdAt: true,
      senderId: true,
      deletedForEveryone: true,
      sender: {
        select: { id: true, name: true, username: true, image: true },
      },
      replyTo: {
        select: {
          id: true,
          text: true,
          sender: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      },
      reactions: { select: { reaction: true, userId: true } },
      pinnedMessage: { select: { id: true } },
    },
  });

  return {
    success: true,
    data: messages.map((message) => {
      const reactionCounts = new Map<
        string,
        { reaction: string; count: number; reactedByUser: boolean }
      >();
      for (const reaction of message.reactions) {
        const existing = reactionCounts.get(reaction.reaction);
        if (existing) {
          existing.count += 1;
          if (reaction.userId === session.user.id) {
            existing.reactedByUser = true;
          }
        } else {
          reactionCounts.set(reaction.reaction, {
            reaction: reaction.reaction,
            count: 1,
            reactedByUser: reaction.userId === session.user.id,
          });
        }
      }

      return {
        id: message.id,
        text: message.text,
        editedAt: message.editedAt,
        isPinned: Boolean(message.pinnedMessage),
        imageUrl: message.imageUrl,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        createdAt: message.createdAt,
        senderId: message.senderId,
        sender: message.sender,
        isOwn: message.senderId === session.user.id,
        deletedForEveryone: message.deletedForEveryone,
        deletedForSelf: false,
        replyTo: message.replyTo,
        reactions: Array.from(reactionCounts.values()),
      };
    }),
  };
}
