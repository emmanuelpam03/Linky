"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { mockGroups } from "@/lib/mock-groups";
import type { Group } from "@/types";
import CreateGroupModal from "./CreateGroupModal";
import GroupItem from "./GroupItem";

export default function GroupList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>(mockGroups);

  const handleCreateGroup = ({
    name,
    description,
  }: {
    name: string;
    description: string;
  }) => {
    const id =
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") || `group-${Date.now()}`;

    setGroups((current) => [
      ...current,
      {
        id,
        name,
        lastMessage: description || "Group created",
        timestamp: "Now",
        icon: "code",
      },
    ]);
  };

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-(--color-border-tertiary) px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-(--color-text-primary)">Groups</h1>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Create and manage your group chats
            </p>
          </div>
          <Button
            variant="brand"
            size="sm"
            className="rounded-lg"
            onClick={() => setCreateOpen(true)}
          >
            + New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {groups.map((group) => (
            <GroupItem key={group.id} group={group} />
          ))}
        </div>
      </div>

      <CreateGroupModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreateGroup={handleCreateGroup}
      />
    </>
  );
}
