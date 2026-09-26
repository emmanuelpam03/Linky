import assert from "node:assert/strict";
import test from "node:test";
import type { MessageItem } from "../types";
import {
  getLatestOwnMessageId,
  getReadReceiptLabel,
} from "../lib/read-receipts";

const createdAt = new Date("2026-11-26T08:00:00.000Z");

function createMessage(
  overrides: Partial<MessageItem> = {},
): MessageItem {
  return {
    id: "message-1",
    text: "Hello",
    imageUrl: null,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    createdAt,
    senderId: "user-1",
    sender: {
      id: "user-1",
      name: "Test User",
      username: "test",
      image: null,
    },
    isOwn: true,
    deletedForEveryone: false,
    deletedForSelf: false,
    ...overrides,
  };
}

test("shows direct-chat receipt for the latest own message", () => {
  const message = createMessage();

  assert.equal(
    getReadReceiptLabel(
      message,
      message.id,
      "DIRECT",
      { "user-2": new Date(createdAt.getTime() + 1) },
    ),
    "Seen",
  );
});

test("shows a group receipt count and omits receipts for older messages", () => {
  const message = createMessage();
  const laterOwnMessage = createMessage({
    id: "message-2",
    createdAt: new Date(createdAt.getTime() + 1),
  });
  const readers = {
    "user-2": new Date(createdAt.getTime() + 2),
    "user-3": new Date(createdAt.getTime() - 1),
  };

  assert.equal(
    getReadReceiptLabel(message, laterOwnMessage.id, "GROUP", readers),
    null,
  );
  assert.equal(
    getReadReceiptLabel(laterOwnMessage, laterOwnMessage.id, "GROUP", readers),
    "Seen by 1",
  );
});

test("does not choose deleted own messages as the latest receipt target", () => {
  const visibleMessage = createMessage();
  const deletedMessage = createMessage({
    id: "message-2",
    deletedForSelf: true,
  });

  assert.equal(
    getLatestOwnMessageId([visibleMessage, deletedMessage]),
    visibleMessage.id,
  );
});
