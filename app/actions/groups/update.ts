"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import {
  uploadImageToImageKit,
  validateImageFile,
} from "@/lib/imagekit/upload";

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
  const validationResult = await validateImageFile(file);
  if (!validationResult.success) {
    return { ...validationResult, imageUrl: null };
  }

  try {
    const result = await uploadImageToImageKit(
      file,
      {
        folder: "converse/groups",
        publicId: `group_${conversationId}`,
        overwrite: true,
      },
      validationResult.format,
    );

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { image: result.url },
    });

    revalidatePath("/groups");
    revalidatePath(`/groups/${conversationId}`);
    revalidatePath("/chats");
    revalidatePath(`/chats/${conversationId}`);

    return { success: true, imageUrl: result.url };
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
