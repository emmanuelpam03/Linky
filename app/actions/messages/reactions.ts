"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function addReaction(messageId: string, reaction: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  const userId = session.user.id;

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) return { success: false, error: "Message not found" };

  try {
    await prisma.messageReaction.create({
      data: { messageId, userId, reaction },
    });
  } catch (e) {
    // ignore unique constraint errors
  }

  return { success: true };
}

export async function removeReaction(messageId: string, reaction: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  const userId = session.user.id;

  await prisma.messageReaction.deleteMany({
    where: { messageId, userId, reaction },
  });

  return { success: true };
}
