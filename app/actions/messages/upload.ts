"use server";

import { getSession } from "@/lib/auth-session";
import prisma from "@/lib/prisma";
import {
  uploadDocumentToImageKit,
  validateDocumentFile,
} from "@/lib/imagekit/document";

export async function uploadDocumentToMessage(
  conversationId: string,
  formData: FormData,
) {
  const session = await getSession();
  if (!session?.user)
    return {
      success: false,
      error: "Unauthorized",
      fileUrl: null,
      fileName: null,
      fileSize: null,
    };

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: session.user.id },
  });
  if (!membership)
    return {
      success: false,
      error: "Not a member of this conversation",
      fileUrl: null,
      fileName: null,
      fileSize: null,
    };

  // Check for blocks in direct conversations
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { members: { select: { userId: true } } },
  });

  if (conversation?.type === "DIRECT") {
    const otherMember = conversation.members.find(
      (m) => m.userId !== session.user.id,
    );
    if (otherMember) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: session.user.id, blockedId: otherMember.userId },
            { blockerId: otherMember.userId, blockedId: session.user.id },
          ],
        },
      });
      if (block)
        return {
          success: false,
          error: "You cannot send messages to this user",
          fileUrl: null,
          fileName: null,
          fileSize: null,
        };
    }
  }

  const file = formData.get("document") as File;
  const validationResult = await validateDocumentFile(file);
  if (!validationResult.success) {
    return {
      ...validationResult,
      fileUrl: null,
      imageUrl: null,
      fileName: null,
      fileSize: null,
    };
  }

  const isMedia = [
    "jpeg",
    "jpg",
    "png",
    "webp",
    "gif",
    "mp4",
    "mov",
    "webm",
  ].includes(validationResult.format);
  const folder = isMedia ? "converse/images" : "converse/documents";
  const publicIdPrefix = isMedia ? "img" : "doc";

  try {
    const result = await uploadDocumentToImageKit(
      file,
      {
        folder,
        publicId: `${publicIdPrefix}_${conversationId}_${Date.now()}`,
        overwrite: false,
      },
      validationResult.format,
    );

    return {
      success: true,
      imageUrl: isImage ? result.url : null,
      fileUrl: isImage ? null : result.url,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch {
    return {
      success: false,
      error: "Upload failed",
      fileUrl: null,
      imageUrl: null,
      fileName: null,
      fileSize: null,
    };
  }
}

export async function deleteUploadedDocument(fileUrl: string) {
  if (!fileUrl) return { success: false, error: "No file URL provided" };

  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const client = (await import("@/lib/imagekit")).getImageKitClient();
    const parsedUrl = new URL(fileUrl);
    const fileId = parsedUrl.pathname.split("/").filter(Boolean).pop();

    if (!fileId) {
      return { success: false, error: "Invalid file URL" };
    }

    await client.delete(`/v1/files/${fileId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Cleanup failed" };
  }
}
