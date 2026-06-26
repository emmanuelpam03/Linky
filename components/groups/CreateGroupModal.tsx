"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFriends } from "@/app/actions/friends/list";
import { createGroup } from "@/app/actions/groups/create";
import { useRouter } from "next/navigation";
import type { Friend } from "@/types";

type CreateGroupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: (groupId: string) => void;
};

export default function CreateGroupModal({
  open,
  onOpenChange,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setIsLoadingFriends(true);
      const result = await getFriends();
      if (result.success) setFriends(result.data);
      setIsLoadingFriends(false);
    };
    load();
  }, [open]);

  if (!open) return null;

  const resetForm = () => {
    setGroupName("");
    setDescription("");
    setSelectedIds([]);
    setError(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = groupName.trim();
    if (!name) return;
    if (selectedIds.length === 0) {
      setError("Add at least one member to create a group");
      return;
    }

    setIsCreating(true);
    setError(null);

    const result = await createGroup({
      name,
      description: description.trim(),
      memberIds: selectedIds,
    });

    if (!result.success) {
      setError(result.error ?? "Failed to create group");
      setIsCreating(false);
      return;
    }

    handleClose();
    if (result.data) {
      onGroupCreated?.(result.data.id);
      router.push(`/groups/${result.data.id}`);
    }

    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-(--color-border-tertiary) bg-(--color-background-primary) px-6 py-7 shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-semibold tracking-tight text-(--color-text-primary)">
            Create a group
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-(--color-text-tertiary) hover:bg-(--color-background-secondary) transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="text-sm text-(--color-text-secondary) mb-6">
          Give your group a name and invite friends to start chatting.
        </p>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <FormField label="Group name">
            <Input
              placeholder="Weekend plans"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Description">
            <Input
              placeholder="Optional group description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <div>
            <p className="text-xs text-(--color-text-secondary) mb-2 font-medium">
              Add members ({selectedIds.length} selected)
            </p>
            {isLoadingFriends ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-5 animate-spin text-(--color-text-tertiary)" />
              </div>
            ) : friends.length === 0 ? (
              <p className="text-sm text-(--color-text-tertiary) py-4 text-center">
                You have no friends to add yet
              </p>
            ) : (
              <div className="max-h-44 overflow-y-auto rounded-xl border border-(--color-border-tertiary) divide-y divide-(--color-border-tertiary)">
                {friends.map((friend) => {
                  const selected = selectedIds.includes(friend.id);
                  const initials = friend.name
                    .split(" ")
                    .map((s) => s[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => toggleMember(friend.id)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 transition-colors",
                        selected
                          ? "bg-(--color-brand-50)"
                          : "hover:bg-(--color-background-secondary)",
                      )}
                    >
                      <Avatar size="sm">
                        <AvatarFallback className="bg-(--color-brand-50) text-[10px] font-medium text-(--color-brand-900)">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-(--color-text-primary) truncate">
                          {friend.name}
                        </p>
                        <p className="text-xs text-(--color-text-secondary) truncate">
                          @{friend.username}
                        </p>
                      </div>
                      {selected && (
                        <Check className="size-4 shrink-0 text-(--color-brand-400)" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-(--color-coral-400)">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg border-(--color-border-tertiary)"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="form"
              className="min-w-28"
              disabled={isCreating || !groupName.trim()}
            >
              {isCreating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
