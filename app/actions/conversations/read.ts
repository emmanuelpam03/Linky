"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function markConversationRead(conversationId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  const userId = session.user.id;

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
  });
  if (!membership) return { success: false, error: "Not a member" };

  await prisma.conversationMember.update({
    where: { id: membership.id },
    data: { lastReadAt: new Date() },
  });

  return { success: true };
}
