import type { MessageItem } from "../types";

export function getLatestOwnMessageId(messages: MessageItem[]) {
  return [...messages]
    .reverse()
    .find(
      (message) =>
        message.isOwn &&
        !message.deletedForEveryone &&
        !message.deletedForSelf,
    )?.id;
}

export function getReadReceiptLabel(
  message: MessageItem,
  latestOwnMessageId: string | undefined,
  conversationType: "DIRECT" | "GROUP",
  lastReadAtByUser: Record<string, Date>,
) {
  if (
    !message.isOwn ||
    message.id !== latestOwnMessageId ||
    message.deletedForEveryone ||
    message.deletedForSelf
  ) {
    return null;
  }

  const messageTime = message.createdAt.getTime();
  const readersCount = Object.values(lastReadAtByUser).filter(
    (lastReadAt) => lastReadAt.getTime() >= messageTime,
  ).length;

  if (readersCount === 0) return null;
  return conversationType === "DIRECT" ? "Seen" : `Seen by ${readersCount}`;
}
