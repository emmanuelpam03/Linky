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
      replyToId: true,
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

  const messageIds = raw.map((r) => r.id);
  let replyByMessage: Record<string, { id: string; text: string | null; sender: { id: string; name: string; username: string; image: string | null } } | null> = {};
  if (messageIds.length > 0) {
    const replyMessages = await prisma.message.findMany({
      where: { id: { in: messageIds.filter((id) => id) } },
      select: {
        id: true,
        text: true,
        replyToId: true,
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

    const replyLookup = new Map<string, { id: string; text: string | null; sender: { id: string; name: string; username: string; image: string | null } }>();
    for (const reply of replyMessages) {
      replyLookup.set(reply.id, {
        id: reply.id,
        text: reply.text,
        sender: reply.sender,
      });
    }

    for (const message of raw) {
      if (!message.replyToId) {
        replyByMessage[message.id] = null;
        continue;
      }

      const replyMessage = replyLookup.get(message.replyToId);
      replyByMessage[message.id] = replyMessage ?? null;
    }
  }

  // If the generated client doesn't expose the `reactions` relation on Message,
  // fetch reactions separately to avoid runtime errors.
  let reactionsByMessage: Record<string, { reaction: string; userId: string }[]> = {};
  if (messageIds.length > 0) {
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId: { in: messageIds } },
      select: { messageId: true, reaction: true, userId: true },
    });
    reactionsByMessage = reactions.reduce((acc: any, r) => {
      acc[r.messageId] = acc[r.messageId] ?? [];
      acc[r.messageId].push({ reaction: r.reaction, userId: r.userId });
      return acc;
    }, {} as Record<string, { reaction: string; userId: string }[]>);
  }

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
      editedAt: (m as any).editedAt ?? null,
      imageUrl: m.imageUrl,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      fileSize: m.fileSize,
      createdAt: m.createdAt,
      senderId: m.senderId,
      sender: m.sender,
      isOwn: m.senderId === userId,
      deletedForEveryone: m.deletedForEveryone,
      deletedForSelf: m.deletedFor?.includes(userId) ?? false,
      replyTo: replyByMessage[m.id]
        ? {
            id: replyByMessage[m.id]!.id,
            text: replyByMessage[m.id]!.text,
            sender: replyByMessage[m.id]!.sender,
          }
        : null,
      reactions: (reactionsByMessage[m.id] ?? []).reduce((acc: any, r: any) => {
        const key = r.reaction;
        const found = acc.find((x: any) => x.reaction === key);
        if (found) {
          found.count += 1;
          if (r.userId === userId) found.reactedByUser = true;
        } else {
          acc.push({ reaction: key, count: 1, reactedByUser: r.userId === userId });
        }
        return acc;
      }, [] as any),
    })),
  };
}
