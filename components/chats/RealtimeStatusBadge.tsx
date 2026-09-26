import type { RealtimeStatus } from "@/lib/websocket";

type RealtimeStatusBadgeProps = {
  status: RealtimeStatus;
};

export default function RealtimeStatusBadge({
  status,
}: RealtimeStatusBadgeProps) {
  return (
    <span
      aria-live="polite"
      className={`inline-flex items-center gap-1 text-[10px] ${
        status === "connected"
          ? "text-(--color-brand-400)"
          : "text-(--color-text-tertiary)"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "connected"
            ? "bg-(--color-brand-400)"
            : "bg-(--color-text-tertiary)"
        }`}
      />
      {status === "connected"
        ? "Live"
        : status === "reconnecting"
          ? "Reconnecting"
          : status === "disconnected"
            ? "Offline"
            : "Connecting"}
    </span>
  );
}
