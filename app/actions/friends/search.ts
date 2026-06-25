"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function searchUsers(query: string) {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: [] };

  if (!query.trim()) return { success: true, data: [] };

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: session.user.id } }, // exclude self
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
    },
    take: 10,
  });

  return { success: true, data: users };
}
