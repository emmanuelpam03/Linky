"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function editMessage(messageId: string, newText: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = session.user.id;

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) return { success: false, error: "Message not found" };
  if (message.senderId !== userId) return { success: false, error: "Unauthorized" };

  const trimmed = newText?.trim() ?? "";
  if (!trimmed) return { success: false, error: "Message must not be empty" };

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { text: trimmed, editedAt: new Date() },
  });

  return {
    success: true,
    data: {
      id: updated.id,
      text: updated.text,
      editedAt: updated.editedAt,
    },
  };
}
