"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import type { MessageItem } from "@/types";

export async function pinMessage(messageId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      conversationId: true,
      deletedForEveryone: true,
      deletedFor: true,
    },
  });
  if (
    !message ||
    message.deletedForEveryone ||
    message.deletedFor.includes(session.user.id)
  ) {
    return { success: false, error: "Message is not available" };
  }

  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId: message.conversationId,
        userId: session.user.id,
      },
    },
    select: { id: true },
  });
  if (!membership) return { success: false, error: "Not a member" };

  await prisma.pinnedMessage.upsert({
    where: { messageId },
    create: {
      conversationId: message.conversationId,
      messageId,
      pinnedById: session.user.id,
    },
    update: {},
  });
  return { success: true };
}

export async function unpinMessage(messageId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { conversationId: true },
  });
  if (!message) return { success: false, error: "Message not found" };

  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId: message.conversationId,
        userId: session.user.id,
      },
    },
    select: { id: true },
  });
  if (!membership) return { success: false, error: "Not a member" };

  await prisma.pinnedMessage.deleteMany({
    where: { messageId, conversationId: message.conversationId },
  });
  return { success: true };
}

export async function getPinnedMessages(
  conversationId: string,
): Promise<{ success: boolean; error?: string; data: MessageItem[] }> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized", data: [] };
  }

  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: session.user.id,
      },
    },
    select: { id: true },
  });
  if (!membership) return { success: false, error: "Not a member", data: [] };

  const pins = await prisma.pinnedMessage.findMany({
    where: {
      conversationId,
      message: {
        deletedForEveryone: false,
        NOT: { deletedFor: { has: session.user.id } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      message: {
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
          deletedFor: true,
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
        },
      },
    },
  });

  const data = pins
    .map(({ message }) => {
      const reactions = new Map<
        string,
        { reaction: string; count: number; reactedByUser: boolean }
      >();
      for (const reaction of message.reactions) {
        const summary = reactions.get(reaction.reaction);
        if (summary) {
          summary.count += 1;
          if (reaction.userId === session.user.id) summary.reactedByUser = true;
        } else {
          reactions.set(reaction.reaction, {
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
        imageUrl: message.imageUrl,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        createdAt: message.createdAt,
        senderId: message.senderId,
        sender: message.sender,
        isOwn: message.senderId === session.user.id,
        deletedForEveryone: message.deletedForEveryone,
        deletedForSelf: message.deletedFor.includes(session.user.id),
        isPinned: true,
        replyTo: message.replyTo,
        reactions: Array.from(reactions.values()),
      };
    });

  return { success: true, data };
}
