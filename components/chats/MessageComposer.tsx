"use client";

type MessageComposerProps = {
  conversationId: string;
};

const MessageComposer = ({ conversationId: _ }: MessageComposerProps) => {
  return (
    <div className="border-t border-(--color-border-tertiary) px-4 py-3">
      <div className="flex items-center gap-2 rounded-xl border border-(--color-border-secondary) px-4 py-2 bg-(--color-background-primary)">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none"
        />
      </div>
    </div>
  );
};

export default MessageComposer;
