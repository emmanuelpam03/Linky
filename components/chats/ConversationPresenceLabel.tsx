type ConversationPresenceLabelProps = {
  conversationType: "DIRECT" | "GROUP";
  onlineUsers: Record<string, string>;
  otherUserId?: string | null;
};

export default function ConversationPresenceLabel({
  conversationType,
  onlineUsers,
  otherUserId,
}: ConversationPresenceLabelProps) {
  const label =
    conversationType === "DIRECT"
      ? otherUserId && onlineUsers[otherUserId]
        ? "Online"
        : "Offline"
      : `${Object.keys(onlineUsers).length} online`;

  return (
    <p
      aria-live="polite"
      className="text-xs text-(--color-text-tertiary)"
    >
      {label}
    </p>
  );
}
