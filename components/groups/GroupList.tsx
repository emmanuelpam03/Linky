"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { mockGroups } from "@/lib/mock-groups";
import CreateGroupModal from "./CreateGroupModal";
import GroupItem from "./GroupItem";

export default function GroupList() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-(--color-border-tertiary) px-4 py-4">
          <h1 className="text-lg font-semibold text-(--color-text-primary)">
            Groups
          </h1>
          <Button
            size="sm"
            className="rounded-md bg-(--color-brand-400) text-white hover:bg-(--color-brand-600)"
            onClick={() => setCreateOpen(true)}
          >
            + New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {mockGroups.map((group) => (
            <GroupItem key={group.id} group={group} />
          ))}
        </div>
      </div>

      <CreateGroupModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
