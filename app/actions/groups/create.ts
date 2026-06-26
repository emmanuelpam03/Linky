"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function createGroup({
  name,
  description,
  memberIds,
}: {
  name: string;
  description?: string;
  memberIds: string[];
}) {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: null };

  const userId = session.user.id;

  // Verify all memberIds are friends of the creator
  const friendships = await prisma.friend.findMany({
    where: {
      userId,
      friendId: { in: memberIds },
    },
    select: { friendId: true },
  });

  const verifiedFriendIds = friendships.map((f) => f.friendId);
  const invalidIds = memberIds.filter((id) => !verifiedFriendIds.includes(id));

  if (invalidIds.length > 0) {
    return {
      success: false,
      error: "You can only add friends to a group",
      data: null,
    };
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: "GROUP",
      name: name.trim(),
      description: description?.trim(),
      createdBy: userId,
      members: {
        create: [
          { userId, role: "ADMIN" },
          ...verifiedFriendIds.map((friendId) => ({
            userId: friendId,
            role: "MEMBER" as const,
          })),
        ],
      },
    },
    select: { id: true, name: true },
  });

  return { success: true, data: conversation };
}
