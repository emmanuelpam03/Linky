"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications/list";
import { useAppRealtime } from "@/components/providers/AppRealtimeProvider";

type NotificationData = Extract<
  Awaited<ReturnType<typeof getNotifications>>,
  { success: true }
>["data"];

export default function NotificationList() {
  const { notificationRevision, refreshNotifications } = useAppRealtime();
  const [notifications, setNotifications] = useState<NotificationData>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getNotifications()
      .then((result) => {
        if (!active) return;
        if (result.success) {
          setNotifications(result.data);
          setError("");
        } else {
          setError(result.error);
        }
      })
      .catch((caught: unknown) => {
        console.error("Could not load notifications:", caught);
        if (active) setError("Could not load notifications. Try again.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [notificationRevision]);

  const markRead = async (id: string) => {
    try {
      const result = await markNotificationRead(id);
      if (!result.success) {
        setError(result.error ?? "Could not update notification.");
        return;
      }
      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, readAt: item.readAt ?? new Date() } : item,
        ),
      );
      refreshNotifications();
    } catch (caught) {
      console.error("Could not mark notification as read:", caught);
      setError("Could not update notification. Try again.");
    }
  };

  const markAllRead = async () => {
    setIsMarkingAllRead(true);
    setError("");
    try {
      const result = await markAllNotificationsRead();
      if (!result.success) {
        setError(result.error ?? "Could not update notifications.");
        return;
      }
      const readAt = new Date();
      setNotifications((current) =>
        current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })),
      );
      refreshNotifications();
    } catch (caught) {
      console.error("Could not mark notifications as read:", caught);
      setError("Could not update notifications. Try again.");
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const hasUnread = notifications.some((item) => !item.readAt);

  return (
    <section className="mx-auto flex h-full w-full max-w-3xl flex-col bg-(--color-background-primary)">
      <header className="flex items-center justify-between border-b border-(--color-border-tertiary) px-6 py-5">
        <div>
          <h1 className="text-lg font-semibold text-(--color-text-primary)">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-(--color-text-secondary)">
            Friend requests, mentions, and calls
          </p>
        </div>
        <button
          type="button"
          disabled={!hasUnread || isMarkingAllRead}
          onClick={() => void markAllRead()}
          className="text-sm text-(--color-brand-500) disabled:text-(--color-text-tertiary)"
        >
          {isMarkingAllRead ? "Marking..." : "Mark all read"}
        </button>
      </header>

      {error && (
        <p role="alert" className="px-6 py-3 text-sm text-(--color-coral-500)">
          {error}
        </p>
      )}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-(--color-text-tertiary)" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-(--color-text-tertiary)">
          <Bell className="size-8" />
          <p className="mt-3 text-sm">You&apos;re all caught up.</p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className="border-b border-(--color-border-tertiary)"
            >
              <Link
                href={notification.href}
                onClick={() => {
                  if (!notification.readAt) void markRead(notification.id);
                }}
                className={`block px-6 py-4 hover:bg-(--color-background-secondary) ${
                  notification.readAt ? "" : "bg-(--color-brand-50)/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {!notification.readAt && (
                    <span
                      aria-label="Unread"
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-(--color-brand-400)"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-(--color-text-primary)">
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                      {notification.body}
                    </p>
                    <time className="mt-2 block text-xs text-(--color-text-tertiary)">
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(notification.createdAt))}
                    </time>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
