"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

export async function getSharedMedia(conversationId: string) {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: [] };

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: session.user.id },
  });
  if (!membership) return { success: false, error: "Not a member", data: [] };

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      imageUrl: { not: null },
      deletedForEveryone: false,
    },
    select: { id: true, imageUrl: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    data: messages.map((m) => ({
      id: m.id,
      imageUrl: m.imageUrl!,
      createdAt: m.createdAt,
    })),
  };
}

export async function getSharedFiles(conversationId: string) {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: [] };

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: session.user.id },
  });
  if (!membership) return { success: false, error: "Not a member", data: [] };

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      fileUrl: { not: null },
      deletedForEveryone: false,
    },
    select: {
      id: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    data: messages.map((m) => ({
      id: m.id,
      fileUrl: m.fileUrl!,
      fileName: m.fileName ?? "File",
      fileSize: m.fileSize,
      createdAt: m.createdAt,
    })),
  };
}

export async function getSharedLinks(conversationId: string) {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: [] };

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: session.user.id },
  });
  if (!membership) return { success: false, error: "Not a member", data: [] };

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      text: { not: null },
      deletedForEveryone: false,
    },
    select: { id: true, text: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const links: { id: string; url: string; createdAt: Date }[] = [];

  for (const m of messages) {
    if (!m.text) continue;
    const matches = m.text.match(URL_REGEX);
    if (matches) {
      for (const url of matches) {
        links.push({ id: `${m.id}-${url}`, url, createdAt: m.createdAt });
      }
    }
  }

  return { success: true, data: links };
}
