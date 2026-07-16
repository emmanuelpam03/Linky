"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];

function isImageFileName(fileName: string | null | undefined) {
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isImageUrl(url: string | null | undefined) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.includes(ext));
}

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
      OR: [{ imageUrl: { not: null } }, { fileUrl: { not: null } }],
      deletedForEveryone: false,
    },
    select: {
      id: true,
      imageUrl: true,
      fileUrl: true,
      fileName: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const media = messages.filter((message) => {
    if (message.imageUrl) return true;
    return isImageFileName(message.fileName);
  });

  return {
    success: true,
    data: media.map((m) => ({
      id: m.id,
      imageUrl: m.imageUrl ?? m.fileUrl ?? "",
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
      OR: [{ fileUrl: { not: null } }, { imageUrl: { not: null } }],
      deletedForEveryone: false,
    },
    select: {
      id: true,
      fileUrl: true,
      imageUrl: true,
      fileName: true,
      fileSize: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const files = messages.filter((message) => {
    if (message.fileUrl && !isImageFileName(message.fileName)) {
      return true;
    }
    return false;
  });

  return {
    success: true,
    data: files.map((m) => ({
      id: m.id,
      fileUrl: m.fileUrl ?? m.imageUrl ?? "",
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
