"use client";

import { Users } from "lucide-react";
import type { Group } from "@/types";
import { GroupIconBadge } from "./GroupIconBadge";

type GroupWindowProps = {
  group?: Group | null;
};

export default function GroupWindow({ group }: GroupWindowProps) {
  if (!group) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-(--color-background-primary)">
        <div className="flex size-20 items-center justify-center rounded-full bg-(--color-brand-50)">
          <Users
            size={36}
            className="text-(--color-brand-400)"
            strokeWidth={1.5}
          />
        </div>
        <h2 className="mt-5 text-base font-semibold text-(--color-text-primary)">
          No group selected
        </h2>
        <p className="mt-1 max-w-xs text-center text-sm text-(--color-text-secondary)">
          Pick a group to view the conversation, or create a new one
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-(--color-background-primary)">
      <header className="flex items-center gap-3 border-b border-(--color-border-tertiary) px-6 py-4">
        <GroupIconBadge icon={group.icon} />
        <h2 className="text-sm font-semibold text-(--color-text-primary)">
          {group.name}
        </h2>
      </header>

      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-(--color-text-tertiary)">
          Messages will appear here
        </p>
      </div>
    </div>
  );
}
