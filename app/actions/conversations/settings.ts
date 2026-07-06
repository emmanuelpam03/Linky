"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function toggleMute(conversationId: string, mute: boolean) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: session.user.id },
  });
  if (!membership) return { success: false, error: "Not a member" };

  await prisma.conversationMember.update({
    where: { id: membership.id },
    data: { isMuted: mute },
  });

  return { success: true };
}

export async function clearChat(conversationId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = session.user.id;

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
  });
  if (!membership) return { success: false, error: "Not a member" };

  // Get all messages not already deleted for this user
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      NOT: { deletedFor: { has: userId } },
    },
    select: { id: true },
  });

  // Add userId to deletedFor for each message
  await Promise.all(
    messages.map((m) =>
      prisma.message.update({
        where: { id: m.id },
        data: { deletedFor: { push: userId } },
      }),
    ),
  );

  revalidatePath("/chats");
  revalidatePath("/groups");
  revalidatePath(`/chats/${conversationId}`);
  revalidatePath(`/groups/${conversationId}`);

  return { success: true };
}

export async function getMuteStatus(conversationId: string) {
  const session = await getSession();
  if (!session?.user) return { isMuted: false };

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: session.user.id },
    select: { isMuted: true },
  });

  return { isMuted: membership?.isMuted ?? false };
}
