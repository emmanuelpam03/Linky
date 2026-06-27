"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import cloudinary from "@/lib/cloudinary";

export async function updateGroup(
  conversationId: string,
  data: { name?: string; description?: string },
) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: session.user.id, role: "ADMIN" },
  });
  if (!membership)
    return { success: false, error: "Only admins can update group info" };

  const updates: { name?: string; description?: string } = {};

  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name) return { success: false, error: "Name cannot be empty" };
    updates.name = name;
  }

  if (data.description !== undefined) {
    updates.description = data.description.trim();
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: updates,
  });

  return { success: true };
}

export async function uploadGroupAvatar(
  conversationId: string,
  formData: FormData,
) {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", imageUrl: null };

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: session.user.id, role: "ADMIN" },
  });
  if (!membership)
    return {
      success: false,
      error: "Only admins can update the group avatar",
      imageUrl: null,
    };

  const file = formData.get("avatar") as File;
  if (!file)
    return { success: false, error: "No file provided", imageUrl: null };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type))
    return {
      success: false,
      error: "Only JPG, PNG or WebP allowed",
      imageUrl: null,
    };

  if (file.size > 2 * 1024 * 1024)
    return { success: false, error: "File must be under 2MB", imageUrl: null };

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "image",
              folder: "converse/groups",
              public_id: `group_${conversationId}`,
              overwrite: true,
            },
            (error, result) => {
              if (error || !result) reject(error);
              else resolve(result);
            },
          )
          .end(buffer);
      },
    );

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { image: result.secure_url },
    });

    return { success: true, imageUrl: result.secure_url };
  } catch {
    return { success: false, error: "Upload failed", imageUrl: null };
  }
}

export async function deleteGroup(conversationId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: session.user.id, role: "ADMIN" },
  });
  if (!membership)
    return { success: false, error: "Only admins can delete the group" };

  // Check they are the creator
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { createdBy: true },
  });

  if (conversation?.createdBy !== session.user.id)
    return { success: false, error: "Only the group creator can delete it" };

  await prisma.conversation.delete({ where: { id: conversationId } });

  return { success: true };
}
