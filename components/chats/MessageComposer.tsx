"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { sendMessage } from "@/app/actions/messages/send";
import type { MessageItem } from "@/types";

type MessageComposerProps = {
  conversationId: string;
  onMessageSent: (message: MessageItem) => void;
};

const MessageComposer = ({
  conversationId,
  onMessageSent,
}: MessageComposerProps) => {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setText("");
    setError(null);

    try {
      const result = await sendMessage({ conversationId, text: trimmed });
      if (result.success && result.data) {
        onMessageSent(result.data as MessageItem);
      } else {
        setText(trimmed); // restore on failure
        setError("Message could not be sent. Try again.");
      }
    } catch {
      setText(trimmed);
      setError("Message could not be sent. Try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-(--color-border-tertiary) px-4 py-3">
      <div className="flex items-center gap-2 rounded-xl border border-(--color-border-secondary) bg-(--color-background-primary) px-4 py-2">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none"
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="shrink-0 rounded-lg p-1.5 text-(--color-brand-400) disabled:text-(--color-text-tertiary) transition-colors hover:bg-(--color-brand-50)"
        >
          {isSending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-(--color-coral-500)">{error}</p>}
    </div>
  );
};

export default MessageComposer;
