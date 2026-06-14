import { Code2, Home, Music, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupIcon } from "@/types";

export const groupIconMap: Record<GroupIcon, LucideIcon> = {
  code: Code2,
  music: Music,
  home: Home,
};

export function GroupIconBadge({
  icon,
  className,
}: {
  icon: GroupIcon;
  className?: string;
}) {
  const Icon = groupIconMap[icon];
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--color-brand-50) text-(--color-brand-900)",
        className
      )}
    >
      <Icon size={18} strokeWidth={2} />
    </div>
  );
}
