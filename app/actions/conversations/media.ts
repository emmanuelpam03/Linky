"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
const VISUAL_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".mp4",
  ".mov",
  ".webm",
  ".heic",
  ".heif",
];

function isVisualAttachment(fileName: string | null | undefined, url: string | null | undefined) {
  const extractTerminalExtension = (input: string | null | undefined) => {
    if (!input) return null;
    // strip query and fragment
    const noQuery = input.split(/[?#]/, 1)[0];
    // if it's a full URL, prefer the pathname
    let path = noQuery;
    try {
      const u = new URL(noQuery);
      path = u.pathname || path;
    } catch {
      // not a valid URL, keep as-is
    }
    const lastSegment = path.split("/").pop() || "";
    const dot = lastSegment.lastIndexOf(".");
    if (dot === -1) return null;
    return lastSegment.slice(dot).toLowerCase();
  };

  const extFromName = extractTerminalExtension(fileName);
  const extFromUrl = extractTerminalExtension(url);

  return [extFromName, extFromUrl].some((e) => !!e && VISUAL_EXTENSIONS.includes(e));
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

  const media = messages.filter((message) =>
    isVisualAttachment(message.fileName, message.imageUrl || message.fileUrl),
  );

  return {
    success: true,
    data: media.map((m) => ({
      id: m.id,
      imageUrl: m.imageUrl || m.fileUrl || "",
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
    if (!message.fileUrl && !message.imageUrl) return false;
    return !isVisualAttachment(message.fileName, message.fileUrl || message.imageUrl);
  });

  return {
    success: true,
    data: files.map((m) => ({
      id: m.id,
      fileUrl: m.fileUrl || m.imageUrl || "",
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
