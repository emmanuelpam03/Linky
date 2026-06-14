"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Group } from "@/types";
import { GroupIconBadge } from "./GroupIconBadge";

type GroupItemProps = {
  group: Group;
};

export default function GroupItem({ group }: GroupItemProps) {
  const pathname = usePathname();
  const href = `/groups/${group.id}`;
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-(--color-background-tertiary)",
        active && "bg-(--color-background-tertiary)"
      )}
    >
      <GroupIconBadge icon={group.icon} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-(--color-text-primary)">
            {group.name}
          </span>
          <span className="shrink-0 text-xs text-(--color-text-tertiary)">
            {group.timestamp}
          </span>
        </div>
        <p className="truncate text-sm text-(--color-text-secondary)">
          {group.lastMessage}
        </p>
      </div>
    </Link>
  );
}
