"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function deleteMessageForSelf(messageId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = session.user.id;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) return { success: false, error: "Message not found" };

  // Add userId to deletedFor array
  await prisma.message.update({
    where: { id: messageId },
    data: {
      deletedFor: {
        push: userId,
      },
    },
  });

  return { success: true };
}

export async function deleteMessageForEveryone(messageId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = session.user.id;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) return { success: false, error: "Message not found" };
  if (message.senderId !== userId)
    return { success: false, error: "Unauthorized" };

  await prisma.message.update({
    where: { id: messageId },
    data: { deletedForEveryone: true },
  });

  return { success: true };
}
