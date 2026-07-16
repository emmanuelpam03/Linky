"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import type { MessageItem } from "@/types";

const MAX_ATTACHMENT_FILE_SIZE_BYTES = 50 * 1024 * 1024;

function validateAttachmentMetadata({
  fileUrl,
  fileName,
  fileSize,
}: {
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}) {
  if (!fileUrl) return null;

  if (!fileName?.trim() || fileName.includes("/") || fileName.includes("\\")) {
    return null;
  }

  if (!Number.isInteger(fileSize) || fileSize! <= 0 || fileSize! > MAX_ATTACHMENT_FILE_SIZE_BYTES) {
    return null;
  }

  const imageKitEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim();
  if (!imageKitEndpoint) {
    return null;
  }

  try {
    const parsedFileUrl = new URL(fileUrl);
    const parsedEndpoint = new URL(imageKitEndpoint);

    if (parsedFileUrl.protocol !== "https:" || parsedEndpoint.protocol !== "https:") {
      return null;
    }

    if (parsedFileUrl.hostname !== parsedEndpoint.hostname) {
      return null;
    }

    if (!parsedFileUrl.pathname || parsedFileUrl.pathname === "/") {
      return null;
    }
  } catch {
    return null;
  }

  return {
    fileUrl,
    fileName: fileName.trim(),
    fileSize,
  };
}

export async function sendMessage({
  conversationId,
  text,
  fileUrl,
  fileName,
  fileSize,
}: {
  conversationId: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = session.user.id;

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
  });
  if (!membership)
    return { success: false, error: "Not a member of this conversation" };

  // For direct conversations, check if either user has blocked the other
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: { select: { userId: true } },
    },
  });

  if (conversation?.type === "DIRECT") {
    const otherMember = conversation.members.find((m) => m.userId !== userId);
    if (otherMember) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: otherMember.userId },
            { blockerId: otherMember.userId, blockedId: userId },
          ],
        },
      });
      if (block)
        return {
          success: false,
          error: "You cannot send messages to this user",
        };
    }
  }

  const trimmedText = text?.trim() ?? "";
  const attachment = validateAttachmentMetadata({ fileUrl, fileName, fileSize });

  if (!trimmedText && !attachment) {
    return { success: false, error: "Message must have text or a file" };
  }

  if (fileUrl && !attachment) {
    return { success: false, error: "Invalid attachment metadata" };
  }

  const raw = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      text: trimmedText || null,
      fileUrl: attachment?.fileUrl || null,
      fileName: attachment?.fileName || null,
      fileSize: attachment?.fileSize ?? null,
    },
    include: {
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

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: raw.createdAt },
  });

  return {
    success: true,
    data: {
      id: raw.id,
      text: raw.text,
      imageUrl: raw.imageUrl,
      fileUrl: raw.fileUrl,
      fileName: raw.fileName,
      fileSize: raw.fileSize,
      createdAt: raw.createdAt,
      senderId: raw.senderId,
      sender: raw.sender,
      isOwn: true,
      deletedForEveryone: false,
      deletedForSelf: false,
    } as MessageItem,
  };
}
