"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { GroupListItem } from "@/types";
import { getGroups } from "@/app/actions/groups/list";
import CreateGroupModal from "./CreateGroupModal";
import GroupItem from "./GroupItem";

export default function GroupList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await getGroups();
      if (result.success) {
        setGroups(result.data);
      } else {
        setError(result.error ?? "Failed to load groups");
      }
    } catch {
      setError("Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGroups();
  }, []);

  const handleGroupCreated = () => {
    loadGroups();
  };

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-(--color-border-tertiary) px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-(--color-text-primary)">
              Groups
            </h1>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-(--color-text-tertiary)" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-(--color-status-error)">{error}</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-(--color-text-tertiary)">
                No groups yet. Create one!
              </p>
            </div>
          ) : (
            groups.map((group) => <GroupItem key={group.id} group={group} />)
          )}
        </div>
      </div>

      <CreateGroupModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onGroupCreated={handleGroupCreated}
      />
    </>
  );
}
