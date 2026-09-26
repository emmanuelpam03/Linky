import assert from "node:assert/strict";
import test from "node:test";
import { parseConversationServerEvent } from "../lib/websocket";

test("parseConversationServerEvent normalizes message timestamps", () => {
  const event = parseConversationServerEvent(
    JSON.stringify({
      type: "message.created",
      conversationId: "conversation-1",
      message: {
        id: "message-1",
        text: "Hello",
        imageUrl: null,
        fileUrl: null,
        fileName: null,
        fileSize: null,
        createdAt: "2026-11-26T08:00:00.000Z",
        senderId: "user-1",
        sender: {
          id: "user-1",
          name: "Test User",
          username: "test",
          image: null,
        },
        isOwn: false,
        deletedForEveryone: false,
        deletedForSelf: false,
      },
    }),
  );

  assert.equal(event?.type, "message.created");
  if (event?.type !== "message.created") {
    assert.fail("Expected a message.created event");
  }
  assert.equal(event.conversationId, "conversation-1");
  assert.ok(event.message.createdAt instanceof Date);
  assert.equal(event.message.text, "Hello");
});

test("parseConversationServerEvent rejects malformed and incomplete events", () => {
  assert.equal(parseConversationServerEvent("not-json"), null);
  assert.equal(
    parseConversationServerEvent(
      JSON.stringify({
        type: "message.created",
        conversationId: "conversation-1",
        message: { id: "message-1" },
      }),
    ),
    null,
  );
});

test("parseConversationServerEvent validates typing updates", () => {
  assert.deepEqual(
    parseConversationServerEvent(
      JSON.stringify({
        type: "typing.updated",
        conversationId: "conversation-1",
        userId: "user-2",
        name: "Other User",
        isTyping: true,
      }),
    ),
    {
      type: "typing.updated",
      conversationId: "conversation-1",
      userId: "user-2",
      name: "Other User",
      isTyping: true,
    },
  );
  assert.equal(
    parseConversationServerEvent(
      JSON.stringify({
        type: "typing.updated",
        conversationId: "conversation-1",
        userId: "user-2",
        isTyping: true,
      }),
    ),
    null,
  );
});
