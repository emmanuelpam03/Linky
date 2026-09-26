type TypingIndicatorProps = {
  users: Record<string, string>;
};

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  const names = Object.values(users);
  const label =
    names.length === 1
      ? `${names[0]} is typing...`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing...`
        : names.length > 2
          ? `${names[0]} and ${names.length - 1} others are typing...`
          : "";

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="h-5 px-6 text-xs text-(--color-text-tertiary)"
    >
      {label}
    </div>
  );
}
