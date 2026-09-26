"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";

export async function getNotifications() {
  const session = await getSession();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized", data: [], unreadCount: 0 };
  }

  const [data, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({
      where: { recipientId: session.user.id, readAt: null },
    }),
  ]);
  return { success: true as const, data, unreadCount };
}

export async function getUnreadNotificationCount() {
  const session = await getSession();
  if (!session?.user) return 0;
  return prisma.notification.count({
    where: { recipientId: session.user.id, readAt: null },
  });
}

export async function markNotificationRead(notificationId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const updated = await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  if (!updated.count) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, recipientId: session.user.id },
      select: { id: true },
    });
    if (!notification) return { success: false, error: "Notification not found" };
  }
  return { success: true };
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { recipientId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { success: true };
}
