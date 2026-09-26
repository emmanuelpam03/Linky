"use server";

import { getSession } from "@/lib/auth-session";
import prisma from "@/lib/prisma";

type CallIceServer = {
  urls: string;
  username?: string;
  credential?: string;
};

export async function getCallIceServers(
  conversationId: string,
): Promise<
  | { success: false; error: string }
  | { success: true; data: CallIceServer[] }
> {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: session.user.id,
      },
    },
    select: {
      conversation: {
        select: {
          type: true,
          members: { select: { userId: true } },
        },
      },
    },
  });
  if (!membership) {
    return { success: false, error: "Not a conversation member" };
  }
  if (membership.conversation.type === "DIRECT") {
    const otherMember = membership.conversation.members.find(
      (member) => member.userId !== session.user.id,
    );
    if (!otherMember) {
      return { success: false, error: "Friend not found" };
    }

    const [friendship, block] = await Promise.all([
      prisma.friend.findFirst({
        where: { userId: session.user.id, friendId: otherMember.userId },
        select: { id: true },
      }),
      prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: session.user.id, blockedId: otherMember.userId },
            { blockerId: otherMember.userId, blockedId: session.user.id },
          ],
        },
        select: { id: true },
      }),
    ]);
    if (!friendship || block) {
      return { success: false, error: "Only friends can call each other" };
    }
  }

  const turnUrl = process.env.TURN_URL?.trim();
  const turnUsername = process.env.TURN_USERNAME?.trim();
  const turnCredential = process.env.TURN_CREDENTIAL?.trim();
  const hasTurnSetting = Boolean(turnUrl || turnUsername || turnCredential);

  if (
    hasTurnSetting &&
    (!turnUrl ||
      !turnUsername ||
      !turnCredential ||
      !/^turns?:/.test(turnUrl))
  ) {
    return {
      success: false,
      error: "TURN_URL, TURN_USERNAME, and TURN_CREDENTIAL must be configured together.",
    };
  }

  return {
    success: true,
    data: [
      { urls: "stun:stun.l.google.com:19302" },
      ...(turnUrl && turnUsername && turnCredential
        ? [{ urls: turnUrl, username: turnUsername, credential: turnCredential }]
        : []),
    ],
  };
}
