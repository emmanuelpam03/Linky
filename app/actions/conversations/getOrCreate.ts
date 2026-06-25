"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

// Deterministic key — always sort so A+B and B+A produce the same key
function buildPairKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

export async function getOrCreateDirectConversation(friendId: string) {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", conversationId: null };

  const userId = session.user.id;

  if (friendId === userId)
    return {
      success: false,
      error: "Cannot start a conversation with yourself",
      conversationId: null,
    };

  const pairKey = buildPairKey(userId, friendId);

  try {
    const conversation = await prisma.$transaction(async (tx) => {
      // Check inside transaction for atomicity
      const existing = await tx.conversation.findUnique({
        where: { pairKey },
        select: { id: true },
      });

      if (existing) return existing;

      return tx.conversation.create({
        data: {
          type: "DIRECT",
          createdBy: userId,
          pairKey,
          members: {
            create: [
              { userId, role: "MEMBER" },
              { userId: friendId, role: "MEMBER" },
            ],
          },
        },
        select: { id: true },
      });
    });

    return { success: true, conversationId: conversation.id };
  } catch (error: unknown) {
    // Unique constraint violation — another request created it concurrently
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      const existing = await prisma.conversation.findUnique({
        where: { pairKey },
        select: { id: true },
      });
      if (existing) return { success: true, conversationId: existing.id };
    }

    return {
      success: false,
      error: "Failed to get or create conversation",
      conversationId: null,
    };
  }
}
