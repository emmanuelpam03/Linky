"use client";

import { useEffect, useState } from "react";
import { Loader2, Pin } from "lucide-react";
import { getPinnedMessages } from "@/app/actions/messages/pins";
import type { MessageItem } from "@/types";

type PinnedMessagesPanelProps = {
  conversationId: string;
  onSelectMessage: (message: MessageItem) => void;
};

export default function PinnedMessagesPanel({
  conversationId,
  onSelectMessage,
}: PinnedMessagesPanelProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getPinnedMessages(conversationId)
      .then((result) => {
        if (!active) return;
        if (result.success) setMessages(result.data);
        else setError(result.error ?? "Could not load pinned messages.");
      })
      .catch((caught: unknown) => {
        console.error("Could not load pinned messages:", caught);
        if (active) setError("Could not load pinned messages.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [conversationId]);

  return (
    <section className="border-b border-(--color-border-tertiary) bg-(--color-background-primary) p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)">
        <Pin className="size-4" />
        Pinned messages
      </h3>
      {error && <p className="mt-2 text-xs text-(--color-coral-500)">{error}</p>}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="size-4 animate-spin text-(--color-text-tertiary)" />
        </div>
      ) : messages.length === 0 ? (
        <p className="mt-2 text-xs text-(--color-text-tertiary)">
          No pinned messages yet.
        </p>
      ) : (
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
          {messages.map((message) => (
            <li key={message.id}>
              <button
                type="button"
                onClick={() => onSelectMessage(message)}
                className="w-full rounded-lg px-3 py-2 text-left hover:bg-(--color-background-secondary)"
              >
                <span className="block text-xs font-medium text-(--color-text-secondary)">
                  {message.sender.name}
                </span>
                <span className="mt-1 block truncate text-sm text-(--color-text-primary)">
                  {message.text ?? message.fileName ?? "Attachment"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
