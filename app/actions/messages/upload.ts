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
    return { ...validationResult, fileUrl: null, fileName: null, fileSize: null };
  }

  try {
    const result = await uploadDocumentToImageKit(
      file,
      {
        folder: "converse/documents",
        publicId: `doc_${conversationId}_${Date.now()}`,
        overwrite: false,
      },
      validationResult.format,
    );

    return {
      success: true,
      fileUrl: result.url,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch {
    return {
      success: false,
      error: "Upload failed",
      fileUrl: null,
      fileName: null,
      fileSize: null,
    };
  }
}
