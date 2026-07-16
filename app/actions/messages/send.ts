"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import type { MessageItem } from "@/types";
import { allowSend } from "@/lib/rateLimit";

const MAX_ATTACHMENT_FILE_SIZE_BYTES = 50 * 1024 * 1024;

function validateAttachmentMetadata({
  imageUrl,
  fileUrl,
  fileName,
  fileSize,
}: {
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}) {
  const attachmentUrl = imageUrl ?? fileUrl;
  if (!attachmentUrl || (imageUrl && fileUrl)) return null;

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
    const parsedFileUrl = new URL(attachmentUrl);
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
    imageUrl: imageUrl ?? null,
    fileUrl: fileUrl ?? null,
    fileName: fileName.trim(),
    fileSize,
  };
}

export async function sendMessage({
  conversationId,
  text,
  fileUrl,
  imageUrl,
  fileName,
  fileSize,
  replyToId,
}: {
  conversationId: string;
  text?: string;
  fileUrl?: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
}) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = session.user.id;

  // rate limit check
  if (!allowSend(userId)) {
    return { success: false, error: "Rate limit exceeded" };
  }

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
  const attachment = validateAttachmentMetadata({
    imageUrl,
    fileUrl,
    fileName,
    fileSize,
  });

  if ((fileUrl || imageUrl) && !attachment) {
    return { success: false, error: "Invalid attachment metadata" };
  }

  if (!trimmedText && !attachment) {
    return { success: false, error: "Message must have text or a file" };
  }

  const raw = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      text: trimmedText || null,
      replyToId: replyToId ?? null,
      imageUrl: attachment?.imageUrl || null,
      fileUrl: attachment?.fileUrl || null,
      fileName: attachment?.fileName || null,
      fileSize: attachment?.fileSize ?? null,
    },
    select: {
      id: true,
      text: true,
      imageUrl: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      createdAt: true,
      senderId: true,
      deletedForEveryone: true,
      deletedFor: true,
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

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: raw.createdAt },
  });

  return {
    success: true,
    data: {
      id: raw.id,
      text: raw.text,
      replyTo: null,
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
